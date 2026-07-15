/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Invite_Ldesc1Inputs */

const en_troops_invite_ldesc1 = /** @type {(inputs: Troops_Invite_Ldesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a scout leader to this troop`)
};

const es_troops_invite_ldesc1 = /** @type {(inputs: Troops_Invite_Ldesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir un líder scout a este troop`)
};

const fr_troops_invite_ldesc1 = /** @type {(inputs: Troops_Invite_Ldesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un responsable scout à cette troupe`)
};

const ar_troops_invite_ldesc1 = /** @type {(inputs: Troops_Invite_Ldesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف قائد كشافة إلى هذه الفرقة`)
};

/**
* | output |
* | --- |
* | "Add a scout leader to this troop" |
*
* @param {Troops_Invite_Ldesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_invite_ldesc1 = /** @type {((inputs?: Troops_Invite_Ldesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Invite_Ldesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_invite_ldesc1(inputs)
	if (locale === "es") return es_troops_invite_ldesc1(inputs)
	if (locale === "fr") return fr_troops_invite_ldesc1(inputs)
	return ar_troops_invite_ldesc1(inputs)
});
export { troops_invite_ldesc1 as "troops.invite.lDesc" }