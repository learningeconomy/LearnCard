/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_TitleInputs */

const en_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export Seed Phrase`)
};

const es_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar frase inicial`)
};

const de_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed-Phrase exportieren`)
};

const ar_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة تصدير البذور`)
};

const fr_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase d'exportation de semences`)
};

const ko_profile_export_title = /** @type {(inputs: Profile_Export_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 문구 내보내기`)
};

/**
* | output |
* | --- |
* | "Export Seed Phrase" |
*
* @param {Profile_Export_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_export_title = /** @type {((inputs?: Profile_Export_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_title(inputs)
	if (locale === "es") return es_profile_export_title(inputs)
	if (locale === "de") return de_profile_export_title(inputs)
	if (locale === "ar") return ar_profile_export_title(inputs)
	if (locale === "fr") return fr_profile_export_title(inputs)
	return ko_profile_export_title(inputs)
});
export { profile_export_title as "profile.export.title" }