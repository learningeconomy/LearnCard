/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Loadingcredentials2Inputs */

const en_skillprofile_step2_loadingcredentials2 = /** @type {(inputs: Skillprofile_Step2_Loadingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading credentials…`)
};

const es_skillprofile_step2_loadingcredentials2 = /** @type {(inputs: Skillprofile_Step2_Loadingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando credenciales…`)
};

const fr_skillprofile_step2_loadingcredentials2 = /** @type {(inputs: Skillprofile_Step2_Loadingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des justificatifs…`)
};

const ar_skillprofile_step2_loadingcredentials2 = /** @type {(inputs: Skillprofile_Step2_Loadingcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل الاعتمادات…`)
};

/**
* | output |
* | --- |
* | "Loading credentials…" |
*
* @param {Skillprofile_Step2_Loadingcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_loadingcredentials2 = /** @type {((inputs?: Skillprofile_Step2_Loadingcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Loadingcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_loadingcredentials2(inputs)
	if (locale === "es") return es_skillprofile_step2_loadingcredentials2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_loadingcredentials2(inputs)
	return ar_skillprofile_step2_loadingcredentials2(inputs)
});
export { skillprofile_step2_loadingcredentials2 as "skillProfile.step2.loadingCredentials" }