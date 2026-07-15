/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Title1Inputs */

const en_networkprompts_join_title1 = /** @type {(inputs: Networkprompts_Join_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join the ScoutPass Network?`)
};

const es_networkprompts_join_title1 = /** @type {(inputs: Networkprompts_Join_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Unirte a la Red ScoutPass?`)
};

const fr_networkprompts_join_title1 = /** @type {(inputs: Networkprompts_Join_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre le réseau ScoutPass ?`)
};

const ar_networkprompts_join_title1 = /** @type {(inputs: Networkprompts_Join_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانضمام إلى شبكة ScoutPass؟`)
};

/**
* | output |
* | --- |
* | "Join the ScoutPass Network?" |
*
* @param {Networkprompts_Join_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_title1 = /** @type {((inputs?: Networkprompts_Join_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_title1(inputs)
	if (locale === "es") return es_networkprompts_join_title1(inputs)
	if (locale === "fr") return fr_networkprompts_join_title1(inputs)
	return ar_networkprompts_join_title1(inputs)
});
export { networkprompts_join_title1 as "networkPrompts.join.title" }