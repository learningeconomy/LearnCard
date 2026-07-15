/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Invite_Lleader1Inputs */

const en_troops_invite_lleader1 = /** @type {(inputs: Troops_Invite_Lleader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite Troop Leader`)
};

const es_troops_invite_lleader1 = /** @type {(inputs: Troops_Invite_Lleader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitar Líder de Troop`)
};

const fr_troops_invite_lleader1 = /** @type {(inputs: Troops_Invite_Lleader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inviter un responsable de troupe`)
};

const ar_troops_invite_lleader1 = /** @type {(inputs: Troops_Invite_Lleader1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعوة قائد فرقة`)
};

/**
* | output |
* | --- |
* | "Invite Troop Leader" |
*
* @param {Troops_Invite_Lleader1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_invite_lleader1 = /** @type {((inputs?: Troops_Invite_Lleader1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Invite_Lleader1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_invite_lleader1(inputs)
	if (locale === "es") return es_troops_invite_lleader1(inputs)
	if (locale === "fr") return fr_troops_invite_lleader1(inputs)
	return ar_troops_invite_lleader1(inputs)
});
export { troops_invite_lleader1 as "troops.invite.lLeader" }