/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Guardianinvite_Sharetitle2Inputs */

const en_family_guardianinvite_sharetitle2 = /** @type {(inputs: Family_Guardianinvite_Sharetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardian Invite`)
};

const es_family_guardianinvite_sharetitle2 = /** @type {(inputs: Family_Guardianinvite_Sharetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitación de tutor`)
};

const fr_family_guardianinvite_sharetitle2 = /** @type {(inputs: Family_Guardianinvite_Sharetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitation de tuteur`)
};

const ar_family_guardianinvite_sharetitle2 = /** @type {(inputs: Family_Guardianinvite_Sharetitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعوة ولي أمر`)
};

/**
* | output |
* | --- |
* | "Guardian Invite" |
*
* @param {Family_Guardianinvite_Sharetitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_guardianinvite_sharetitle2 = /** @type {((inputs?: Family_Guardianinvite_Sharetitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Guardianinvite_Sharetitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_guardianinvite_sharetitle2(inputs)
	if (locale === "es") return es_family_guardianinvite_sharetitle2(inputs)
	if (locale === "fr") return fr_family_guardianinvite_sharetitle2(inputs)
	return ar_family_guardianinvite_sharetitle2(inputs)
});
export { family_guardianinvite_sharetitle2 as "family.guardianInvite.shareTitle" }