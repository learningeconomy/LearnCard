/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Perms_TitleInputs */

const en_troops_perms_title = /** @type {(inputs: Troops_Perms_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions`)
};

const es_troops_perms_title = /** @type {(inputs: Troops_Perms_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos`)
};

const fr_troops_perms_title = /** @type {(inputs: Troops_Perms_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations`)
};

const ar_troops_perms_title = /** @type {(inputs: Troops_Perms_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصلاحيات`)
};

/**
* | output |
* | --- |
* | "Permissions" |
*
* @param {Troops_Perms_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_perms_title = /** @type {((inputs?: Troops_Perms_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Perms_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_perms_title(inputs)
	if (locale === "es") return es_troops_perms_title(inputs)
	if (locale === "fr") return fr_troops_perms_title(inputs)
	return ar_troops_perms_title(inputs)
});
export { troops_perms_title as "troops.perms.title" }