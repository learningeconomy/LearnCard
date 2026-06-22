/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Nextcredential2Inputs */

const en_skillprofile_step2_nextcredential2 = /** @type {(inputs: Skillprofile_Step2_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next credential`)
};

const es_skillprofile_step2_nextcredential2 = /** @type {(inputs: Skillprofile_Step2_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente credencial`)
};

const fr_skillprofile_step2_nextcredential2 = /** @type {(inputs: Skillprofile_Step2_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Justificatif suivant`)
};

const ar_skillprofile_step2_nextcredential2 = /** @type {(inputs: Skillprofile_Step2_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتماد التالي`)
};

/**
* | output |
* | --- |
* | "Next credential" |
*
* @param {Skillprofile_Step2_Nextcredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_nextcredential2 = /** @type {((inputs?: Skillprofile_Step2_Nextcredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Nextcredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_nextcredential2(inputs)
	if (locale === "es") return es_skillprofile_step2_nextcredential2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_nextcredential2(inputs)
	return ar_skillprofile_step2_nextcredential2(inputs)
});
export { skillprofile_step2_nextcredential2 as "skillProfile.step2.nextCredential" }