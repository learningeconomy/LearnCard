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

const fr_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sur invitation uniquement`)
};

const ar_settings_privacy_connectionrequestsinviteonly3 = /** @type {(inputs: Settings_Privacy_Connectionrequestsinviteonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدعوة فقط`)
};

/**
* | output |
* | --- |
* | "Invite only" |
*
* @param {Settings_Privacy_Connectionrequestsinviteonly3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequestsinviteonly3 = /** @type {((inputs?: Settings_Privacy_Connectionrequestsinviteonly3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequestsinviteonly3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequestsinviteonly3(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequestsinviteonly3(inputs)
	return ar_settings_privacy_connectionrequestsinviteonly3(inputs)
});
export { settings_privacy_connectionrequestsinviteonly3 as "settings.privacy.connectionRequestsInviteOnly" }