/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Invite_Lscout1Inputs */

const en_troops_invite_lscout1 = /** @type {(inputs: Troops_Invite_Lscout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite Scout`)
};

const es_troops_invite_lscout1 = /** @type {(inputs: Troops_Invite_Lscout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitar Scout`)
};

const fr_troops_invite_lscout1 = /** @type {(inputs: Troops_Invite_Lscout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inviter un Scout`)
};

const ar_troops_invite_lscout1 = /** @type {(inputs: Troops_Invite_Lscout1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعوة كشاف`)
};

/**
* | output |
* | --- |
* | "Invite Scout" |
*
* @param {Troops_Invite_Lscout1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_invite_lscout1 = /** @type {((inputs?: Troops_Invite_Lscout1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Invite_Lscout1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_invite_lscout1(inputs)
	if (locale === "es") return es_troops_invite_lscout1(inputs)
	if (locale === "fr") return fr_troops_invite_lscout1(inputs)
	return ar_troops_invite_lscout1(inputs)
});
export { troops_invite_lscout1 as "troops.invite.lScout" }