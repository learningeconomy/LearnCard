/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Connectionrequestsinviteonly3Inputs */

const en_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite only`)
};

const es_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo por invitación`)
};

const de_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nur auf Einladung`)
};

const ar_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدعوة فقط`)
};

const fr_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sur invitation uniquement`)
};

const ko_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초대만 가능`)
};

/**
* | output |
* | --- |
* | "Invite only" |
*
* @param {Settings_Privacy_Connectionrequestsinviteonly3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequestsinviteonly3 = /** @type {((inputs?: Settings_Privacy_Connectionrequestsinviteonly3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequestsinviteonly3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "de") return de_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "ar") return ar_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequestsinviteonly3(inputs)
	return ko_settings_privacy_connectionrequestsinviteonly3(inputs)
});
export { settings_privacy_connectionrequestsinviteonly3 as "settings.privacy.connectionRequestsInviteOnly" }