import { IReduxState, IStore } from '../app/types';
import { toggleUpdateAudioSettings } from '../base/tracks/actions.web';
import { getLocalJitsiAudioTrackSettings } from '../base/tracks/functions.any';

/**
 * Whether the browser is processing the microphone.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function isAudioProcessingEnabled(state: IReduxState): boolean {
    const settings = state['features/settings'].audioSettings
        ?? getLocalJitsiAudioTrackSettings(state);

    return settings?.echoCancellation !== false;
}

/**
 * Turns the browser's audio processing on or off for the microphone.
 *
 * One switch for echo cancellation, noise suppression and gain control,
 * because they are not independently useful here and their consequences are
 * not separable either. Chrome's processing downmixes to mono, so with it on a
 * microphone is one channel whatever channel count is requested, and with it
 * off the device's own width comes through. Offering four controls invited the
 * question "why does the stereo box do nothing", whose honest answer is that
 * this is the only control there ever was.
 *
 * On is right for a person in a room: without echo cancellation the call hears
 * itself back through their speakers. Off is for an instrument, an interface,
 * or anything else where the processing is destroying what it is trying to
 * clean up.
 *
 * Desktop audio is untouched either way — ScreenObtainer captures that track
 * with no processing of its own accord, which is why shared audio already
 * sounds right.
 *
 * @returns {Function}
 */
export function toggleAudioProcessing() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const enabled = !isAudioProcessingEnabled(getState());

        // These three, unlike channel count, can be applied to a microphone
        // that is already open, so the change is audible immediately rather
        // than at the next capture.
        await dispatch(toggleUpdateAudioSettings({
            autoGainControl: enabled,
            echoCancellation: enabled,
            noiseSuppression: enabled
        }));
    };
}
