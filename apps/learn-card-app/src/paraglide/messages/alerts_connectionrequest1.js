/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Connectionrequest1Inputs */

const en_alerts_connectionrequest1 = /** @type {(inputs: Alerts_Connectionrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request`)
};

const es_alerts_connectionrequest1 = /** @type {(inputs: Alerts_Connectionrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de conexión`)
};

const fr_alerts_connectionrequest1 = /** @type {(inputs: Alerts_Connectionrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion`)
};

const ar_alerts_connectionrequest1 = /** @type {(inputs: Alerts_Connectionrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب اتصال`)
};

/**
* | output |
* | --- |
* | "Connection Request" |
*
* @param {Alerts_Connectionrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_connectionrequest1 = /** @type {((inputs?: Alerts_Connectionrequest1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Connectionrequest1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_connectionrequest1(inputs)
	if (locale === "es") return es_alerts_connectionrequest1(inputs)
	if (locale === "fr") return fr_alerts_connectionrequest1(inputs)
	return ar_alerts_connectionrequest1(inputs)
});
export { alerts_connectionrequest1 as "alerts.connectionRequest" }