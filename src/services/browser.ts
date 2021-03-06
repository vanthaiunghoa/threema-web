/**
 * This file is part of Threema Web.
 *
 * Threema Web is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Threema Web. If not, see <http://www.gnu.org/licenses/>.
 */

import BrowserName = threema.BrowserName;

export class BrowserService {
    private logTag: string = '[BrowserService]';

    private browser: threema.BrowserInfo;
    private $log: ng.ILogService;
    private $window: ng.IWindowService;
    private isPageVisible = true;
    private supportsExtendedLocaleCompareCache: boolean;

    public static $inject = ['$log', '$window'];
    constructor($log: ng.ILogService, $window: ng.IWindowService) {
        // Angular services
        this.$log = $log;
        this.$window = $window;
        this.initializePageVisibility();
    }

    private initializePageVisibility() {
        const onChange = (isVisible: any) => {
            if (this.isPageVisible !== isVisible) {
                this.isPageVisible = isVisible;
            }
        };

        let pageHiddenKey = 'hidden';

        // add default visibility change listener
        let defaultListener;
        if (pageHiddenKey in document) {
            defaultListener = 'visibilitychange';
        } else if ('mozHidden' in document) {
            pageHiddenKey = 'mozHidden';
            defaultListener = 'mozvisibilitychange';
        } else if ('webkitHidden' in document) {
            pageHiddenKey = 'webkitHidden';
            defaultListener = 'webkitvisibilitychange';
        } else if ('msHidden' in document) {
            pageHiddenKey = 'msHidden';
            defaultListener = 'msvisibilitychange';
        }

        document.addEventListener(defaultListener, function() {
            onChange(!this[pageHiddenKey]);
        });

        // configure other document and window events
        const map = {
            focus: true,
            blur: false,
        };

        for (const event in map) {
            if (map[event] !== undefined) {
                document.addEventListener(event, () => {
                    onChange(map[event]);
                }, false);

                window.addEventListener(event, () => {
                    onChange(map[event]);
                }, false);
            }
        }

        // initial visible state set
        if (document[pageHiddenKey] !== undefined ) {
            onChange(!document[pageHiddenKey]);
        }
    }

    public getBrowser(): threema.BrowserInfo {
        if (this.browser === undefined) {
            this.browser = {
                chrome: false,
                firefox: false,
                ie: false,
                edge: false,
                opera: false,
                safari: false,
            } as threema.BrowserInfo;

            const uagent = this.$window.navigator.userAgent.toLowerCase();

            this.browser.chrome  = /webkit/.test(uagent)  && /chrome/.test(uagent) && !/edge/.test(uagent);
            this.browser.firefox = /mozilla/.test(uagent) && /firefox/.test(uagent);
            this.browser.ie      = (/msie/.test(uagent) || /trident/.test(uagent)) && !/edge/.test(uagent);
            this.browser.edge    = /edge/.test(uagent);
            this.browser.safari  = /safari/.test(uagent)  && /applewebkit/.test(uagent) && !/chrome/.test(uagent);
            this.browser.opera   = /mozilla/.test(uagent) && /applewebkit/.test(uagent)
                && /chrome/.test(uagent) && /safari/.test(uagent) && /opr/.test(uagent);

            if (this.browser.opera && this.browser.chrome) {
                this.browser.chrome = false;
            }

            for (const x in this.browser) {
                if (this.browser[x]) {
                    let b;
                    if (x === 'ie') {
                        b = 'msie';
                    } else if (x === 'edge') {
                        b = 'edge';
                    } else if (x === 'opera') {
                        b = 'opr';
                    } else if (x === 'safari') {
                        b = 'version';
                    } else {
                        b = x;
                    }
                    let match = uagent.match(new RegExp('(' + b + ')( |\/)([0-9]+)'));

                    let version;
                    if (match) {
                        version = match[3];
                    } else {
                        match = uagent.match(new RegExp('rv:([0-9]+)'));
                        version = match ? match[1] : '';
                    }
                    const versionInt: number = parseInt(match[3], 10);
                    this.browser.version = isNaN(versionInt) ? undefined : versionInt;

                    break;
                }
            }

            if (this.browser.chrome) {
                this.browser.name = BrowserName.Chrome;
                this.browser.textInfo = 'Chrome ' + this.browser.version;
            }
            if (this.browser.firefox) {
                this.browser.name = BrowserName.Firefox;
                this.browser.textInfo = 'Firefox ' + this.browser.version;
            }
            if (this.browser.ie) {
                this.browser.name = BrowserName.InternetExplorer;
                this.browser.textInfo = 'Internet Explorer ' + this.browser.version;
            }
            if (this.browser.edge) {
                this.browser.name = BrowserName.Edge;
                this.browser.textInfo = 'Edge ' + this.browser.version;
            }
            if (this.browser.safari) {
                this.browser.name = BrowserName.Safari;
                this.browser.textInfo = 'Safari ' + this.browser.version;
            }
            if (this.browser.opera) {
                this.browser.name = BrowserName.Opera;
                this.browser.textInfo = 'Opera ' + this.browser.version;
            }
        }

        return this.browser;
    }

    public isVisible() {
        return this.isPageVisible;
    }

    /**
     * Return whether the current browser supports the WebRTC task or not.
     */
    public supportsWebrtcTask() {
        if (this.browser === undefined) {
            this.getBrowser();
        }
        if (this.browser.safari) {
            return false;
        }
        return true;
    }

    /**
     * Return whether the browser supports extended `string.localeCompare` options.
     */
    public supportsExtendedLocaleCompare() {
        if (this.supportsExtendedLocaleCompareCache !== undefined) {
            return this.supportsExtendedLocaleCompareCache;
        }

        function getSupport(): boolean {
            try {
                'foo'.localeCompare('bar', 'i');
            } catch (e) {
                return e.name === 'RangeError';
            }
            return false;
        }

        const support = getSupport();
        this.supportsExtendedLocaleCompareCache = support;
        this.$log.debug(this.logTag, 'Browser',
            support ? 'supports' : 'does not support',
            'extended locale compare options');
        return support;
    }
}
