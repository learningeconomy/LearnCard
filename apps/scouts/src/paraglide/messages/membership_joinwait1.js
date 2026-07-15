/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Membership_Joinwait1Inputs */

const en_membership_joinwait1 = /** @type {(inputs: Membership_Joinwait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join Waiting List`)
};

const es_membership_joinwait1 = /** @type {(inputs: Membership_Joinwait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse a Lista de Espera`)
};

const fr_membership_joinwait1 = /** @type {(inputs: Membership_Joinwait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre la liste d'attente`)
};

const ar_membership_joinwait1 = /** @type {(inputs: Membership_Joinwait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانضمام لقائمة الانتظار`)
};

/**
* | output |
* | --- |
* | "Join Waiting List" |
*
* @param {Membership_Joinwait1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const membership_joinwait1 = /** @type {((inputs?: Membership_Joinwait1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Membership_Joinwait1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_membership_joinwait1(inputs)
	if (locale === "es") return es_membership_joinwait1(inputs)
	if (locale === "fr") return fr_membership_joinwait1(inputs)
	return ar_membership_joinwait1(inputs)
});
export { membership_joinwait1 as "membership.joinWait" }