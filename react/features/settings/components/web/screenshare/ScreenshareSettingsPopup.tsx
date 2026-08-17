import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import Popover from '../../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import { toggleScreenshareSettings } from '../../../actions.web';
import { getScreenshareSettingsVisibility } from '../../../functions.any';

import ScreenshareSettingsContent from './ScreenshareSettingsContent';

interface IProps {

    /**
     * Component's children (the screen share button).
     */
    children: ReactNode;

    /**
     * Flag controlling the visibility of the popup.
     */
    isOpen: boolean;

    /**
     * Callback executed when the popup closes.
     */
    onClose: Function;

    /**
     * The popup placement enum value.
     */
    popupPlacement: string;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'inline-block'
        }
    };
});

/**
 * Popup with screen share settings, opened from the arrow on the share button
 * the way the microphone's and camera's are.
 *
 * @returns {ReactElement}
 */
function ScreenshareSettingsPopup({ children, isOpen, onClose, popupPlacement }: IProps) {
    const { classes, cx } = useStyles();

    return (
        <div className = { cx(classes.container, 'screenshare-preview') }>
            <Popover
                allowClick = { true }
                content = { <ScreenshareSettingsContent /> }
                headingId = 'screenshare-settings-button'
                onPopoverClose = { onClose }
                position = { popupPlacement }
                trigger = 'click'
                visible = { isOpen }>
                {children}
            </Popover>
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { videoSpaceWidth } = state['features/base/responsive-ui'];

    return {
        popupPlacement: videoSpaceWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end',
        isOpen: Boolean(getScreenshareSettingsVisibility(state))
    };
}

const mapDispatchToProps = {
    onClose: toggleScreenshareSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(ScreenshareSettingsPopup);
