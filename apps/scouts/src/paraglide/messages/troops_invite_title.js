/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Invite_TitleInputs */

const en_troops_invite_title = /** @type {(inputs: Troops_Invite_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who would you like to invite?`)
};

const es_troops_invite_title = /** @type {(inputs: Troops_Invite_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿A quién te gustaría invitar?`)
};

const fr_troops_invite_title = /** @type {(inputs: Troops_Invite_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qui souhaitez-vous inviter ?`)
};

const ar_troops_invite_title = /** @type {(inputs: Troops_Invite_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who would you like to invite?`)
};

/**
* | output |
* | --- |
* | "Who would you like to invite?" |
*
* @param {Troops_Invite_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_invite_title = /** @type {((inputs?: Troops_Invite_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Invite_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_invite_title(inputs)
	if (locale === "es") return es_troops_invite_title(inputs)
	if (locale === "fr") return fr_troops_invite_title(inputs)
	return ar_troops_invite_title(inputs)
});
export { troops_invite_title as "troops.invite.title" }