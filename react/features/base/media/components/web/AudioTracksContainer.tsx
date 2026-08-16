import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { isScreenshareAudioSourceName } from '../../../../screen-share/functions';
import { getRemoteScreenshareParticipantId } from '../../../participants/functions';
import { ITrack } from '../../../tracks/types';
import { MEDIA_TYPE } from '../../constants';

import AudioTrack from './AudioTrack';

/**
 * A remote audio track, and the participant whose volume it follows.
 */
interface IAudioTrackToPlay {

    /**
     * The participant the volume of this track belongs to, which is not always the endpoint that sent it.
     */
    participantId: string;

    /**
     * The track itself.
     */
    track: ITrack;
}

/**
 * The type of the React {@code Component} props of {@link AudioTracksContainer}.
 */
interface IProps {

    /**
     * Every remote audio track, each with the participant its volume follows.
     */
    _audioTracks: IAudioTrackToPlay[];
}

/**
 * A container for the remote tracks audio elements.
 *
 * @param {IProps} props - The props of the component.
 * @returns {Array<ReactElement>}
 */
function AudioTracksContainer(props: IProps) {
    const { _audioTracks } = props;

    return (
        <div>
            {
                _audioTracks.map(({ participantId, track }) => {
                    const audioTrackId = track.jitsiTrack?.getId();
                    const id = `remoteAudio_${audioTrackId || ''}`;

                    return (
                        <AudioTrack
                            audioTrack = { track }
                            id = { id }
                            key = { id }
                            participantId = { participantId } />
                    );
                })
            }
        </div>
    );
}

/**
 * Maps (parts of) the Redux state to the associated {@code AudioTracksContainer}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    // NOTE: The disadvantage of this approach is that the component will re-render on any track change.
    // One way to solve the problem would be to pass only the participant ID to the AudioTrack component and
    // find the corresponding track inside the AudioTrack's mapStateToProps. But currently this will be very
    // inefficient because features/base/tracks is an array and in order to find a track by participant ID
    // we need to go through the array. Introducing a map participantID -> track could be beneficial in this case.
    return {
        _audioTracks: state['features/base/tracks']
            .filter(track => !track.local && track.mediaType === MEDIA_TYPE.AUDIO)
            .map(track => {
                // The sound of a screen share is played as the share's own participant rather than as the person
                // sharing it. AudioTrack looks its volume up by participant id, so this is the line that gives the
                // two separate volumes: the shared application can be turned down, or off, with the voice explaining
                // it left alone — and it goes quiet by itself when the share does, because the participant does.
                //
                // A share of sound with no picture has no screenshare participant to belong to, and falls back to
                // its sender: one volume for both, as it was, rather than a slider with nothing behind it.
                const screenshareId = isScreenshareAudioSourceName(track.jitsiTrack?.getSourceName())
                    ? getRemoteScreenshareParticipantId(state, track.participantId)
                    : undefined;

                return {
                    participantId: screenshareId ?? track.participantId,
                    track
                };
            })
    };
}

export default connect(_mapStateToProps)(AudioTracksContainer);
