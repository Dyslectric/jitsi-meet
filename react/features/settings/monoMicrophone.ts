import { IReduxState, IStore } from '../app/types';
import { toggleUpdateAudioSettings } from '../base/tracks/actions.web';
import { getLocalJitsiAudioTrackSettings } from '../base/tracks/functions.any';

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
 * Desktop audio is deliberately untouched. It comes from getDisplayMedia by way
 * of ScreenObtainer, which asks for two channels of its own accord, and a game
 * or a video mixed for two channels is the reason stereo gets turned on at all.
 * A microphone has one capsule, so its second channel is a copy of the first
 * that every participant pays to receive.
 *
 * @returns {Function}
 */
export function toggleMonoMicrophone() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mono = !isMonoMicrophoneEnabled(getState());

        // Applies to the microphone that is open now and stores the choice for
        // the next one; channel count is a capture constraint, so both halves
        // are needed for the setting to mean anything.
        await dispatch(toggleUpdateAudioSettings({ channelCount: mono ? 1 : 2 }));
    };
}
