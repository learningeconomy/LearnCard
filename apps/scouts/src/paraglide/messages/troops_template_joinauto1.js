/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Template_Joinauto1Inputs */

const en_troops_template_joinauto1 = /** @type {(inputs: Troops_Template_Joinauto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining this troop will automatically add all its members to your contacts.`)
};

const es_troops_template_joinauto1 = /** @type {(inputs: Troops_Template_Joinauto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse a este troop añadirá automáticamente a todos sus miembros a tus contactos.`)
};

const fr_troops_template_joinauto1 = /** @type {(inputs: Troops_Template_Joinauto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre cette troupe ajoutera automatiquement tous ses membres à vos contacts.`)
};

const ar_troops_template_joinauto1 = /** @type {(inputs: Troops_Template_Joinauto1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانضمام إلى هذه الفرقة سيضيف تلقائياً جميع أعضائها إلى جهات اتصالك.`)
};

/**
* | output |
* | --- |
* | "Joining this troop will automatically add all its members to your contacts." |
*
* @param {Troops_Template_Joinauto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_template_joinauto1 = /** @type {((inputs?: Troops_Template_Joinauto1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Template_Joinauto1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_template_joinauto1(inputs)
	if (locale === "es") return es_troops_template_joinauto1(inputs)
	if (locale === "fr") return fr_troops_template_joinauto1(inputs)
	return ar_troops_template_joinauto1(inputs)
});
export { troops_template_joinauto1 as "troops.template.joinAuto" }