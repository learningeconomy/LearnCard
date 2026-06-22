/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Connectionrequestsanyone2Inputs */

const en_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone`)
};

const es_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cualquiera`)
};

const fr_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout le monde`)
};

const ar_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الجميع`)
};

/**
* | output |
* | --- |
* | "Anyone" |
*
* @param {Settings_Privacy_Connectionrequestsanyone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequestsanyone2 = /** @type {((inputs?: Settings_Privacy_Connectionrequestsanyone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequestsanyone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequestsanyone2(inputs)
	return ar_settings_privacy_connectionrequestsanyone2(inputs)
});
export { settings_privacy_connectionrequestsanyone2 as "settings.privacy.connectionRequestsAnyone" }