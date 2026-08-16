import { IReduxState } from '../app/types';
import { isWindows } from '../base/environment/environment';
import { isMobileBrowser } from '../base/environment/utils';
import { browser } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import { getRemoteScreenshareParticipantId } from '../base/participants/functions';
import { getLocalDesktopTrack } from '../base/tracks/functions';

/**
 * Is the current screen sharing session audio only.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isAudioOnlySharing(state: IReduxState) {
    return isScreenAudioShared(state) && !isScreenVideoShared(state);
}

/**
 * State of audio sharing.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenAudioShared(state: IReduxState) {
    return state['features/screen-share'].isSharingAudio;
}

/**
 * Returns the visibility of the audio only screen share button. Currently only chrome browser and electron on
 * windows supports this functionality.
 *
 * @returns {boolean}
 */
export function isScreenAudioSupported() {
    return (!isMobileBrowser() && browser.isChromiumBased()) || (browser.isElectron() && isWindows());
}

/**
 * Whether the sound of a screen share travels as a source of its own rather than mixed into the microphone.
 *
 * Upstream mixes the two together with an AudioMixerEffect, and what is wrong with sharing audio follows from that
 * one decision. The pair arrive at a listener as a single track, so the shared application cannot be turned down
 * without turning the person down, and closing their video cannot stop their sound. It also leaves the sharer's
 * microphone carrying something that has to be unpicked from it again when the share ends — and a stop that does not
 * finish unpicking leaves the shared sound on their microphone for the rest of the call.
 *
 * The flag is lib-jitsi-meet's own, read here rather than mirrored: it is what opens the guard in
 * JitsiConference.addTrack against a second audio source, so a deployment that has not set it would have this code
 * publishing a track the library refuses. One flag, so the two cannot disagree.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isSeparateScreenshareAudioEnabled(state: IReduxState) {
    return Boolean(state['features/base/config'].testing?.allowMultipleTracks);
}

/**
 * Whether a source name names the sound of a screen share rather than a microphone.
 *
 * Source names are `<endpoint>-a<index>`, and a microphone is the endpoint's `-a0`: the library hands out the lowest
 * index nothing is using, and a share claims 1 for itself rather than be counted — see getScreenshareAudioSourceName,
 * without which an endpoint sharing before it has a microphone would take 0. There is nothing else in this
 * application that publishes a second audio source, which is what makes the index enough to tell the two apart; if
 * that ever stops being true, this is where an explicit signal would go instead.
 *
 * Deliberately not matched with a lone `\d`: a translated audio source is `-a0.<language>`, and treating one of those
 * as a screen share would silence somebody's interpreter behind a slider they never opened.
 *
 * @param {string|undefined} sourceName - The source name to examine.
 * @returns {boolean}
 */
export function isScreenshareAudioSourceName(sourceName?: string) {
    return Boolean(sourceName && (/-a[1-9]\d*$/).test(sourceName));
}

/**
 * The source name to publish the sound of a screen share under, which is the convention above read the other way.
 *
 * Said rather than left to the library, which would name it by counting the endpoint's audio sources: that is -a1
 * for somebody with a microphone and -a0 for somebody without one, and -a0 is how a microphone is addressed — by the
 * matcher above, and by translation. A share from an endpoint that joined with no microphone, or that was refused
 * one, would arrive at the far end looking exactly like a voice, which is a screen share that cannot be turned down.
 * The index is claimed instead, and a microphone granted afterwards takes the lowest one left, which is 0.
 *
 * @param {string} ownerId - The endpoint doing the sharing.
 * @returns {string}
 */
export function getScreenshareAudioSourceName(ownerId: string) {
    return `${ownerId}-a1`;
}

/**
 * The participant id the sound of somebody's screen share is played under, if they are sending any.
 *
 * Which is not their own: the sound belongs to the share, so it is played as the screenshare participant and its
 * volume is stored under that id. Anything offering a control over it has to say the same id back, or it will be
 * moving a slider that belongs to the microphone.
 *
 * Undefined covers both "not sharing sound" and "sharing sound with no picture" — the second because a share with no
 * video has no screenshare participant to be played as, and falls back to its sender.
 *
 * @param {IReduxState} state - The state of the application.
 * @param {string|undefined} ownerId - The endpoint doing the sharing.
 * @returns {string|undefined}
 */
export function getScreenshareAudioParticipantId(state: IReduxState, ownerId?: string) {
    if (!ownerId) {
        return undefined;
    }

    const sharingAudio = state['features/base/tracks'].some(track =>
        !track.local
        && track.mediaType === MEDIA_TYPE.AUDIO
        && track.participantId === ownerId
        && isScreenshareAudioSourceName(track.jitsiTrack?.getSourceName()));

    return sharingAudio ? getRemoteScreenshareParticipantId(state, ownerId) : undefined;
}

/**
 * Is any screen media currently being shared, audio or video.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenMediaShared(state: IReduxState) {
    return isScreenAudioShared(state) || isScreenVideoShared(state);
}

/**
 * Is screen sharing currently active.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenVideoShared(state: IReduxState) {
    const tracks = state['features/base/tracks'];
    const localScreenshare = getLocalDesktopTrack(tracks);

    return localScreenshare?.jitsiTrack && !localScreenshare.jitsiTrack.isMuted();
}
