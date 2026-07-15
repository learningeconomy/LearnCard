/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Scoutpassnumber2Inputs */

const en_userprofile_scoutpassnumber2 = /** @type {(inputs: Userprofile_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass Number (DID)`)
};

const es_userprofile_scoutpassnumber2 = /** @type {(inputs: Userprofile_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de ScoutPass (DID)`)
};

const fr_userprofile_scoutpassnumber2 = /** @type {(inputs: Userprofile_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro ScoutPass (DID)`)
};

const ar_userprofile_scoutpassnumber2 = /** @type {(inputs: Userprofile_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم ScoutPass (DID)`)
};

/**
* | output |
* | --- |
* | "ScoutPass Number (DID)" |
*
* @param {Userprofile_Scoutpassnumber2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_scoutpassnumber2 = /** @type {((inputs?: Userprofile_Scoutpassnumber2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Scoutpassnumber2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_scoutpassnumber2(inputs)
	if (locale === "es") return es_userprofile_scoutpassnumber2(inputs)
	if (locale === "fr") return fr_userprofile_scoutpassnumber2(inputs)
	return ar_userprofile_scoutpassnumber2(inputs)
});
export { userprofile_scoutpassnumber2 as "userProfile.scoutpassNumber" }