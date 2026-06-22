/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Skillprofile_Editedon2Inputs */

const en_skillprofile_editedon2 = /** @type {(inputs: Skillprofile_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edited on ${i?.date}`)
};

const es_skillprofile_editedon2 = /** @type {(inputs: Skillprofile_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Editado el ${i?.date}`)
};

const fr_skillprofile_editedon2 = /** @type {(inputs: Skillprofile_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modifié le ${i?.date}`)
};

const ar_skillprofile_editedon2 = /** @type {(inputs: Skillprofile_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حُرّر في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Edited on {date}" |
*
* @param {Skillprofile_Editedon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_editedon2 = /** @type {((inputs: Skillprofile_Editedon2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Editedon2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_editedon2(inputs)
	if (locale === "es") return es_skillprofile_editedon2(inputs)
	if (locale === "fr") return fr_skillprofile_editedon2(inputs)
	return ar_skillprofile_editedon2(inputs)
});
export { skillprofile_editedon2 as "skillProfile.editedOn" }