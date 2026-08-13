import { IReduxState, IStore } from '../app/types';
import { updateSettings } from '../base/settings/actions';
import { toggleUpdateAudioSettings } from '../base/tracks/actions.web';

/**
 * Whether the microphone is being mixed down to one channel.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function isMonoMicrophoneEnabled(state: IReduxState): boolean {
    return state['features/base/settings'].monoMicrophone !== false;
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

        dispatch(updateSettings({ monoMicrophone: mono }));

        // Channel count is a capture constraint, so the track has to be told;
        // this is the same path the audio settings already use, which merges
        // the change over whatever else is currently applied.
        await dispatch(toggleUpdateAudioSettings({ channelCount: mono ? 1 : 2 }));
    };
}
