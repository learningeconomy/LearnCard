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

const fr_sidemenu_links_alerts = /** @type {(inputs: Sidemenu_Links_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
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
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_alerts = /** @type {((inputs?: Sidemenu_Links_AlertsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_AlertsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_alerts(inputs)
	if (locale === "es") return es_sidemenu_links_alerts(inputs)
	if (locale === "fr") return fr_sidemenu_links_alerts(inputs)
	return ar_sidemenu_links_alerts(inputs)
});
export { sidemenu_links_alerts as "sidemenu.links.alerts" }