import ReducerRegistry from '../base/redux/ReducerRegistry';
import { IAudioSettings } from '../base/settings/reducer';

import {
    SET_AUDIO_SETTINGS,
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_PREVIEW_AUDIO_TRACK,
    SET_SCREENSHARE_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';

export interface ISettingsState {
    audioSettings?: IAudioSettings;
    audioSettingsVisible?: boolean;
    previewAudioTrack?: any | null;
    screenshareSettingsVisible?: boolean;
    videoSettingsVisible?: boolean;
}

ReducerRegistry.register('features/settings', (state: ISettingsState = {}, action) => {
    switch (action.type) {
    case SET_AUDIO_SETTINGS_VISIBILITY:
        return {
            ...state,
            audioSettingsVisible: action.value
        };
    case SET_SCREENSHARE_SETTINGS_VISIBILITY:
        return {
            ...state,
            screenshareSettingsVisible: action.value
        };
    case SET_VIDEO_SETTINGS_VISIBILITY:
        return {
            ...state,
            videoSettingsVisible: action.value
        };
    case SET_PREVIEW_AUDIO_TRACK:
        return {
            ...state,
            previewAudioTrack: action.track
        };
    case SET_AUDIO_SETTINGS:
        return {
            ...state,
            audioSettings: action.settings
        };
    }

    return state;
});
