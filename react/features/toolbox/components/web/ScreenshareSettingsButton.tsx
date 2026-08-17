import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { IconArrowUp } from '../../../base/icons/svg';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import { toggleScreenshareSettings } from '../../../settings/actions.web';
import ScreenshareSettingsPopup from '../../../settings/components/web/screenshare/ScreenshareSettingsPopup';
import { getScreenshareSettingsVisibility } from '../../../settings/functions.any';
import { isDesktopShareButtonDisabled } from '../../functions.web';

import ShareDesktopButton from './ShareDesktopButton';

interface IProps {

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;
}

/**
 * The screen share button, with an arrow that opens the frame rate menu -- the
 * same shape as the microphone's and the camera's.
 *
 * The arrow is not offered on mobile browsers, where there is no screen sharing
 * to configure, and the plain button is rendered instead of an arrow that would
 * open a menu over a feature that cannot run.
 *
 * @returns {ReactElement}
 */
const ScreenshareSettingsButton = ({ buttonKey, notifyMode }: IProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const isOpen = Boolean(useSelector(getScreenshareSettingsVisibility));
    const isDisabled = useSelector((state: IReduxState) => isDesktopShareButtonDisabled(state));

    const onClick = useCallback((e?: React.MouseEvent) => {
        if (isOpen) {
            e?.stopPropagation();
        }
        dispatch(toggleScreenshareSettings());
    }, [ dispatch, isOpen ]);

    const onEscClick = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            dispatch(toggleScreenshareSettings());
        }
    }, [ dispatch, isOpen ]);

    if (isMobileBrowser() || !JitsiMeetJS.isDesktopSharingEnabled()) {
        return (
            <ShareDesktopButton
                buttonKey = { buttonKey }
                notifyMode = { notifyMode } />
        );
    }

    return (
        <ScreenshareSettingsPopup>
            <ToolboxButtonWithIcon
                ariaControls = 'screenshare-settings-dialog'
                ariaExpanded = { isOpen }
                ariaHasPopup = { true }
                ariaLabel = { t('toolbar.screenshareSettings') }
                buttonKey = { buttonKey }
                icon = { IconArrowUp }
                iconDisabled = { isDisabled }
                iconId = 'screenshare-settings-button'
                iconTooltip = { t('toolbar.screenshareSettings') }
                notifyMode = { notifyMode }
                onIconClick = { onClick }
                onIconKeyDown = { onEscClick }>
                <ShareDesktopButton
                    buttonKey = { buttonKey }
                    notifyMode = { notifyMode } />
            </ToolboxButtonWithIcon>
        </ScreenshareSettingsPopup>
    );
};

export default ScreenshareSettingsButton;
