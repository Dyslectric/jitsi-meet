import { IReduxState, IStore } from '../app/types';
import { replaceLocalTrack } from '../base/tracks/actions.any';
import { getLocalJitsiAudioTrack, getLocalJitsiAudioTrackSettings } from '../base/tracks/functions.any';
import { createLocalTracksF } from '../base/tracks/functions.web';

import { setAudioSettings } from './actions.web';

/**
 * Whether the microphone is being mixed down to one channel.
 *
 * Read from the same place capture reads it, rather than from a preference of
 * its own: audio settings are already persisted and already applied to the next
 * microphone opened, so a second copy of the answer could only ever disagree
 * with the first.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function isMonoMicrophoneEnabled(state: IReduxState): boolean {
    const settings = state['features/settings'].audioSettings
        ?? getLocalJitsiAudioTrackSettings(state);

    return settings?.channelCount !== 2;
}

/**
 * Mixes the microphone down to mono, or lets it back out to two channels.
 *
 * This only decides anything with echo cancellation OFF. Chrome's audio
 * processing downmixes to mono, so with cancellation on the microphone has one
 * channel whatever is asked for here; with it off the device's own width comes
 * through, and this is what asks for less than that. Mono with no cancellation
 * is a real combination — a stereo interface that should not be sent as two
 * identical channels — and it is not reachable any other way.
 *
 * Desktop audio is untouched. It comes from getDisplayMedia by way of
 * ScreenObtainer, which asks for two channels of its own accord, and a game or
 * a video mixed for two channels is the reason stereo gets turned on at all.
 *
 * @returns {Function}
 */
export function toggleMonoMicrophone() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mono = !isMonoMicrophoneEnabled(getState());

        // Stored directly rather than through toggleUpdateAudioSettings, which
        // applies the constraints and then stores whatever the live track
        // reports afterwards. Channel count is the one setting applyConstraints
        // cannot change on a running track, so that path reads back the width
        // the microphone still has and saves that — silently replacing the
        // choice with its opposite, which is why this looked both dead and
        // sticky.
        const current = getLocalJitsiAudioTrackSettings(getState());

        dispatch(setAudioSettings({ ...current, channelCount: mono ? 1 : 2 }));

        // And re-opens the current one, because that is the only way it takes
        // effect: applyConstraints cannot change the channel count of a track
        // that is already running, which is why this looked dead when it only
        // stored the setting. createLocalTracksF reads the stored settings back
        // out, so the new track is captured at the width just chosen.
        const track_ = getLocalJitsiAudioTrack(getState());

        if (!track_) {
            return;
        }

        const [ track ] = await createLocalTracksF({ devices: [ 'audio' ] });

        if (track) {
            await dispatch(replaceLocalTrack(track_, track));
        }
    };
}
