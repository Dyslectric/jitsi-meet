import { IStore } from '../app/types';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { updateSettings } from '../base/settings/actions';
import { replaceLocalTrack } from '../base/tracks/actions.any';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions.any';

/**
 * Whether the microphone is being mixed down to one channel.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function isMonoMicrophoneEnabled(state: any): boolean {
    return state['features/base/settings'].monoMicrophone !== false;
}

/**
 * Mixes the microphone down to mono, or lets it back out to the width of the
 * device, and re-captures it so the change takes effect.
 *
 * Channel count is a capture constraint rather than something that can be
 * changed on a live track, so this replaces the local audio track. Desktop
 * audio is deliberately untouched: it comes from getDisplayMedia by way of
 * ScreenObtainer, which asks for two channels of its own accord, and a game or
 * a video mixed for two channels is the reason stereo is turned on at all.
 *
 * The capture is done here rather than through createLocalTracks because that
 * path applies one set of audio options to every track in the conference. The
 * stream is wrapped afterwards so the rest of the application sees an ordinary
 * JitsiLocalTrack.
 *
 * @returns {Function}
 */
export function toggleMonoMicrophone() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const mono = !isMonoMicrophoneEnabled(state);

        dispatch(updateSettings({ monoMicrophone: mono }));

        const current = getLocalJitsiAudioTrack(state);

        // Nothing to re-capture yet; the preference is stored and the next
        // microphone to be opened is captured with it.
        if (!current) {
            return;
        }

        const deviceId = current.getDeviceId();
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                // Carried over rather than left to the browser's defaults:
                // these are what makes a microphone intelligible in a room,
                // and dropping them here would silently undo them.
                autoGainControl: true,
                channelCount: mono ? 1 : 2,
                echoCancellation: true,
                noiseSuppression: true,
                ...(deviceId ? { deviceId: { exact: deviceId } } : {})
            }
        });

        const [ track ] = JitsiMeetJS.createLocalTracksFromMediaStreams([ {
            mediaType: 'audio',
            stream
        } ]);

        await dispatch(replaceLocalTrack(current, track));
    };
}
