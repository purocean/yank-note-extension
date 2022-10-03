export declare type FirebaseAnalyticsJSCodedEvent = {
    [key: string]: any;
};
export interface FirebaseAnalyticsJSConfig {
    /**
     * **(Required)** Measurement-Id as found in the web Firebase-config.
     * The format is G-XXXXXXXXXX.
     */
    measurementId: string;
}
export interface FirebaseAnalyticsJSOptions {
    /**
     * **(Required)** Anonymously identifies a particular user, device, or browser instance.
     * For the web, this is generally stored as a first-party cookie with a two-year expiration.
     * For mobile apps, this is randomly generated for each particular instance of an application install.
     * The value of this field should be a random UUID (version 4) as described in http://www.ietf.org/rfc/rfc4122.txt.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid
     */
    clientId: string;
    /**
     * Max cache time in msec (default = 5000).
     * Caches events fired within a certain time-frame and then
     * sends them to the Google Measurement API in a single batch.
     */
    maxCacheTime?: number;
    /**
     * Enables strict data format checks for logEvent and setUserProperties.
     * When enabled, causes `logEvent` and `setUserProperties` to strictly check
     * whether any event- names & values and user-properties conform to the
     * native SDK requirements.
     */
    strictNativeEmulation?: boolean;
    /**
     * Document title (e.g. "My Awesome Page").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dt
     */
    docTitle?: string;
    /**
     * Document location URL (e.g. "https://myawesomeapp.com").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#dl
     */
    docLocation?: string;
    /**
     * Screen-resolution in the format "WxH" (e.g "2000x1440").
     * This is a browser specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#sr
     */
    screenRes?: string;
    /**
     * Application name (e.g. "My Awesome App").
     * This is a mobile app specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#an
     */
    appName?: string;
    /**
     * Application version (e.g. "1.2").
     * This is a mobile app specific field.
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#av
     */
    appVersion?: string;
    /**
     * User language (e.g. "en-us").
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ul
     */
    userLanguage?: string;
    /**
     * Origin (default =  "firebase").
     */
    origin?: string;
    /**
     * Custom query arguments that are appended to the POST request that is send to the
     * Google Measurement API v2.
     *
     * @example
     * ```
     * const analytics = new FirebaseAnalyticsJS(config, {
     *   appName: 'My Awesome App',
     *   customArg: {
     *     vp: '123x456', // Add viewport-size
     *     sd: '24-bits' // Add screen-colors
     *   }
     * });
     * ```
     */
    customArgs?: {
        [key: string]: any;
    };
}
/**
 * A pure JavaScript Google Firebase Analytics implementation that uses
 * the HTTPS Measurement API 2 to send events to Google Analytics.
 *
 * This class provides an alternative for the Firebase Analytics module
 * shipped with the Firebase JS SDK. That library uses the gtag.js dependency
 * and requires certain browser features. This prevents the use
 * analytics on other platforms, such as Node-js and react-native.
 *
 * FirebaseAnalyticsJS provides a bare-bone implementation of the new
 * HTTPS Measurement API 2 protocol (which is undocumented), with an API
 * that follows the Firebase Analytics JS SDK.
 */
export declare class FirebaseAnalyticsJS {
    readonly url: string;
    private enabled;
    readonly config: FirebaseAnalyticsJSConfig;
    private userId?;
    private userProperties?;
    private screenName?;
    private eventQueue;
    private options;
    private flushEventsPromise;
    private flushEventsTimer;
    constructor(config: FirebaseAnalyticsJSConfig, options: FirebaseAnalyticsJSOptions);
    /**
     * Sends 1 or more coded-events to the back-end.
     * When only 1 event is provided, it is send inside the query URL.
     * When more than 1 event is provided, the event-data is send in
     * the body of the POST request.
     */
    private send;
    private addEvent;
    private flushEvents;
    /**
     * Clears any queued events and cancels the flush timer.
     */
    clearEvents(): void;
    /**
     * Parses an event (as passed to logEvent) and throws an error when the
     * event-name or parameters are invalid.
     *
     * Upon success, returns the event in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseEvent(options: FirebaseAnalyticsJSOptions, eventName: string, eventParams?: {
        [key: string]: any;
    }): FirebaseAnalyticsJSCodedEvent;
    /**
     * Parses user-properties (as passed to setUserProperties) and throws an error when
     * one of the user properties is invalid.
     *
     * Upon success, returns the user-properties in encoded format, ready to be send
     * through the Google Measurement API v2.
     */
    static parseUserProperty(options: FirebaseAnalyticsJSOptions, userPropertyName: string, userPropertyValue: any): string;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#log-event
     */
    logEvent(eventName: string, eventParams?: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-analytics-collection-enabled
     */
    setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-current-screen
     */
    setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-id
     */
    setUserId(userId: string | null): Promise<void>;
    /**
     * https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics#set-user-properties
     */
    setUserProperties(userProperties: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * Clears all analytics data for this instance.
     */
    resetAnalyticsData(): Promise<void>;
}
