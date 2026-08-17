/**
 * The frame rates a screen share can be captured at, offered from the arrow on
 * the share button.
 *
 * A short list rather than a slider, because the choice is not really a number:
 * it is what the share is FOR. Anything above 5 makes lib-jitsi-meet treat the
 * share as motion rather than as a document -- the content hint, the encoder's
 * degradation preference and the bitrate ceiling all change with it -- so 5 and
 * "anything else" are genuinely different modes, and the rates between are the
 * usual trade of smoothness against the CPU it costs to encode.
 *
 * 60 is a ceiling and not a promise. What arrives depends on what the platform's
 * capturer can hand over: a window share on Windows reaches it, a whole 3440x1440
 * monitor measured around 50.
 */
export const SCREENSHARE_FRAME_RATES = [
    {
        frameRate: 60,
        labelKey: 'screenshareSettings.smooth'
    },
    {
        frameRate: 30,
        labelKey: 'screenshareSettings.balanced'
    },
    {
        frameRate: 5,
        labelKey: 'screenshareSettings.detailed'
    }
];

/**
 * The rate used when neither the user nor the deployment has chosen one. It
 * matches lib-jitsi-meet's own default, so an unconfigured deployment behaves
 * exactly as it did before this menu existed.
 */
export const SCREENSHARE_DEFAULT_FRAME_RATE = 5;
