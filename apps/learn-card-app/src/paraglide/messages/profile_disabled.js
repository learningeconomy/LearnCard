/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_DisabledInputs */

const en_profile_disabled = /** @type {(inputs: Profile_DisabledInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(disabled)`)
};

const es_profile_disabled = /** @type {(inputs: Profile_DisabledInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(desactivado)`)
};

const fr_profile_disabled = /** @type {(inputs: Profile_DisabledInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(désactivé)`)
};

const ar_profile_disabled = /** @type {(inputs: Profile_DisabledInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(عاجز)`)
};

/**
* | output |
* | --- |
* | "(disabled)" |
*
* @param {Profile_DisabledInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_disabled = /** @type {((inputs?: Profile_DisabledInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_DisabledInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_disabled(inputs)
	if (locale === "es") return es_profile_disabled(inputs)
	if (locale === "fr") return fr_profile_disabled(inputs)
	return ar_profile_disabled(inputs)
});
export { profile_disabled as "profile.disabled" }