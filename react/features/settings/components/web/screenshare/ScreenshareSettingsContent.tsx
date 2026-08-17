import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { updateSettings } from '../../../../base/settings/actions';
import { getScreenshareFrameRate } from '../../../../base/settings/functions.web';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';
import { SCREENSHARE_FRAME_RATES } from '../../../../screen-share/constants';
import { toggleScreenshareSettings } from '../../../actions.web';

const useStyles = makeStyles()(theme => {
    return {
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: theme.spacing(1),
            maxHeight: 'calc(100dvh - 100px)',
            overflow: 'auto',
            width: '300px'
        },
        hint: {
            ...theme.typography.labelRegular,
            color: theme.palette.text03,
            padding: `${theme.spacing(1)} ${theme.spacing(3)} ${theme.spacing(2)}`
        }
    };
});

/**
 * The frame rate a screen share is captured at, chosen while the conference is
 * running rather than only in config.
 *
 * It is fixed at capture, so a change takes effect on the next share rather than
 * on the one in progress -- which is why the hint says so rather than leaving
 * someone watching an unchanged picture and wondering.
 *
 * @returns {ReactElement}
 */
const ScreenshareSettingsContent = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const current = useSelector((state: IReduxState) => getScreenshareFrameRate(state));

    const onSelect = useCallback((frameRate: number) => () => {
        dispatch(updateSettings({ screenshareFrameRate: frameRate }));
        dispatch(toggleScreenshareSettings());
    }, [ dispatch ]);

    return (
        <ContextMenu
            accessibilityLabel = { t('screenshareSettings.title') }
            className = { classes.contextMenu }
            hidden = { false }
            id = 'screenshare-settings-dialog'>
            <ContextMenuItemGroup>
                {SCREENSHARE_FRAME_RATES.map(({ frameRate, labelKey }) => (
                    <ContextMenuItem
                        accessibilityLabel = { t(labelKey) }
                        key = { frameRate }
                        onClick = { onSelect(frameRate) }
                        role = 'menuitem'
                        selected = { frameRate === current }
                        text = { t(labelKey) } />
                ))}
            </ContextMenuItemGroup>
            <div className = { classes.hint }>{t('screenshareSettings.appliesToNextShare')}</div>
        </ContextMenu>
    );
};

export default ScreenshareSettingsContent;
