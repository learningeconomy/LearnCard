/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Previouscredential2Inputs */

const en_skillprofile_step2_previouscredential2 = /** @type {(inputs: Skillprofile_Step2_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Previous credential`)
};

const es_skillprofile_step2_previouscredential2 = /** @type {(inputs: Skillprofile_Step2_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial anterior`)
};

const fr_skillprofile_step2_previouscredential2 = /** @type {(inputs: Skillprofile_Step2_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Justificatif précédent`)
};

const ar_skillprofile_step2_previouscredential2 = /** @type {(inputs: Skillprofile_Step2_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتماد السابق`)
};

/**
* | output |
* | --- |
* | "Previous credential" |
*
* @param {Skillprofile_Step2_Previouscredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_previouscredential2 = /** @type {((inputs?: Skillprofile_Step2_Previouscredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Previouscredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_previouscredential2(inputs)
	if (locale === "es") return es_skillprofile_step2_previouscredential2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_previouscredential2(inputs)
	return ar_skillprofile_step2_previouscredential2(inputs)
});
export { skillprofile_step2_previouscredential2 as "skillProfile.step2.previousCredential" }