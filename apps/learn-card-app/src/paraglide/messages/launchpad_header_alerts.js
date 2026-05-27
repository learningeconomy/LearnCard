/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Header_AlertsInputs */

const en_launchpad_header_alerts = /** @type {(inputs: Launchpad_Header_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

const es_launchpad_header_alerts = /** @type {(inputs: Launchpad_Header_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertas`)
};

const de_launchpad_header_alerts = /** @type {(inputs: Launchpad_Header_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benachrichtigungen`)
};

const ar_launchpad_header_alerts = /** @type {(inputs: Launchpad_Header_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنبيهات`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Launchpad_Header_AlertsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_header_alerts = /** @type {((inputs?: Launchpad_Header_AlertsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Header_AlertsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_header_alerts(inputs)
	if (locale === "es") return es_launchpad_header_alerts(inputs)
	if (locale === "de") return de_launchpad_header_alerts(inputs)
	return ar_launchpad_header_alerts(inputs)
});
export { launchpad_header_alerts as "launchpad.header.alerts" }