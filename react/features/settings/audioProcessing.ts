import { IReduxState, IStore } from '../app/types';
import { replaceLocalTrack } from '../base/tracks/actions.any';
import { getLocalJitsiAudioTrack, getLocalJitsiAudioTrackSettings } from '../base/tracks/functions.any';
import { createLocalTracksF } from '../base/tracks/functions.web';

import { setAudioSettings } from './actions.web';

/**
 * Whether the browser is processing the microphone.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
/**
 * What the user chose this session, if they chose anything.
 *
 * Deliberately not in the store. features/settings.audioSettings is written
 * from the live track's own getSettings() as well as by this switch, and a
 * device that cannot do echo cancellation reports false there whatever was
 * requested — most virtual inputs do. Reading the switch's state back out of it
 * meant the switch showed off at load, on a microphone that was being processed
 * exactly as asked.
 *
 * A module variable is also the right lifetime: it resets when the page does,
 * so every call starts with the processing on and a choice to turn it off lasts
 * for that call only.
 */
let chosen: boolean | undefined;

export function isAudioProcessingEnabled(_state: IReduxState): boolean {
    return chosen ?? true;
}

/**
 * Turns the browser's audio processing on or off for the microphone.
 *
 * One switch for echo cancellation, noise suppression, gain control and the
 * channel count, because they are not independently useful here and their
 * consequences are not separable: Chrome's processing downmixes to mono, so
 * with it on a microphone is one channel whatever is asked for, and with it off
 * the device's own width comes through.
 *
 * On is right for a person in a room — without echo cancellation the call hears
 * itself back through their speakers. Off is for an instrument, an interface,
 * or anything else the processing is destroying while trying to clean it up.
 *
 * Desktop audio is untouched either way; ScreenObtainer captures that track
 * with no processing of its own accord.
 *
 * @returns {Function}
 */
export function toggleAudioProcessing() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const enabled = !isAudioProcessingEnabled(getState());

        chosen = enabled;
        const current = getLocalJitsiAudioTrackSettings(getState());

        // Stored directly rather than through toggleUpdateAudioSettings, which
        // applies the constraints and then saves whatever the live track
        // reports back afterwards. Channel count cannot be changed on a running
        // track, so that path reads back the width the microphone still has and
        // saves that — replacing the choice with its opposite, and the capture
        // below would then faithfully reproduce the old width.
        dispatch(setAudioSettings({
            ...current,
            autoGainControl: enabled,
            channelCount: enabled ? 1 : 2,
            echoCancellation: enabled,
            noiseSuppression: enabled
        }));

        // Then reopen the microphone. The three processing constraints would
        // have applied to the running track, but the channel count would not,
        // so without this the switch half works: the processing changes and the
        // width does not. createLocalTracksF reads the settings stored above,
        // so the replacement is captured exactly as asked.
        const existing = getLocalJitsiAudioTrack(getState());

        if (!existing) {
            return;
        }

        const [ track ] = await createLocalTracksF({ devices: [ 'audio' ] });

        if (track) {
            await dispatch(replaceLocalTrack(existing, track));
        }
    };
}
