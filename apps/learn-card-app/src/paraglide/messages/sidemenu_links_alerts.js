/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_AlertsInputs */

const en_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

const es_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertas`)
};

const de_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benachrichtigungen`)
};

const ar_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنبيهات`)
};

const fr_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
};

const ko_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알림`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Sidemenu_Links_AlertsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_alerts = /** @type {((inputs?: Sidemenu_Links_AlertsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AlertsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_alerts(inputs)
	if (locale === "es") return es_sidemenu_links_alerts(inputs)
	if (locale === "de") return de_sidemenu_links_alerts(inputs)
	if (locale === "ar") return ar_sidemenu_links_alerts(inputs)
	if (locale === "fr") return fr_sidemenu_links_alerts(inputs)
	return ko_sidemenu_links_alerts(inputs)
});
export { sidemenu_links_alerts as "sidemenu.links.alerts" }