/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Saveprofile1Inputs */

const en_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Profile`)
};

const es_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar perfil`)
};

const de_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil speichern`)
};

const ar_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ الملف الشخصي`)
};

const fr_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer le profil`)
};

const ko_pathways_saveprofile1 = /** @type {(inputs: Pathways_Saveprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 저장`)
};

/**
* | output |
* | --- |
* | "Save Profile" |
*
* @param {Pathways_Saveprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_saveprofile1 = /** @type {((inputs?: Pathways_Saveprofile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Saveprofile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_saveprofile1(inputs)
	if (locale === "es") return es_pathways_saveprofile1(inputs)
	if (locale === "de") return de_pathways_saveprofile1(inputs)
	if (locale === "ar") return ar_pathways_saveprofile1(inputs)
	if (locale === "fr") return fr_pathways_saveprofile1(inputs)
	return ko_pathways_saveprofile1(inputs)
});
export { pathways_saveprofile1 as "pathways.saveProfile" }