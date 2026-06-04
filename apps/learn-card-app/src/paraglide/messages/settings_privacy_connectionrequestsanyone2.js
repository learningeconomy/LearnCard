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

const de_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeder`)
};

const ar_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الجميع`)
};

const fr_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout le monde`)
};

const ko_settings_privacy_connectionrequestsanyone2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsanyone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모든 사람`)
};

/**
* | output |
* | --- |
* | "Anyone" |
*
* @param {Settings_Privacy_Connectionrequestsanyone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequestsanyone2 = /** @type {((inputs?: Settings_Privacy_Connectionrequestsanyone2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequestsanyone2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "de") return de_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "ar") return ar_settings_privacy_connectionrequestsanyone2(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequestsanyone2(inputs)
	return ko_settings_privacy_connectionrequestsanyone2(inputs)
});
export { settings_privacy_connectionrequestsanyone2 as "settings.privacy.connectionRequestsAnyone" }