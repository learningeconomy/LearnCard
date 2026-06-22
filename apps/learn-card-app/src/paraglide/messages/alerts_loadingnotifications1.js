/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Loadingnotifications1Inputs */

const en_alerts_loadingnotifications1 = /** @type {(inputs: Alerts_Loadingnotifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading Notifications...`)
};

const es_alerts_loadingnotifications1 = /** @type {(inputs: Alerts_Loadingnotifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando notificaciones...`)
};

const fr_alerts_loadingnotifications1 = /** @type {(inputs: Alerts_Loadingnotifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des notifications...`)
};

const ar_alerts_loadingnotifications1 = /** @type {(inputs: Alerts_Loadingnotifications1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل الإشعارات...`)
};

/**
* | output |
* | --- |
* | "Loading Notifications..." |
*
* @param {Alerts_Loadingnotifications1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_loadingnotifications1 = /** @type {((inputs?: Alerts_Loadingnotifications1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Loadingnotifications1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_loadingnotifications1(inputs)
	if (locale === "es") return es_alerts_loadingnotifications1(inputs)
	if (locale === "fr") return fr_alerts_loadingnotifications1(inputs)
	return ar_alerts_loadingnotifications1(inputs)
});
export { alerts_loadingnotifications1 as "alerts.loadingNotifications" }