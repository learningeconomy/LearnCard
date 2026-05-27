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

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Sidemenu_Links_AlertsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_alerts = /** @type {((inputs?: Sidemenu_Links_AlertsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AlertsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_alerts(inputs)
	if (locale === "es") return es_sidemenu_links_alerts(inputs)
	if (locale === "de") return de_sidemenu_links_alerts(inputs)
	return ar_sidemenu_links_alerts(inputs)
});
export { sidemenu_links_alerts as "sidemenu.links.alerts" }