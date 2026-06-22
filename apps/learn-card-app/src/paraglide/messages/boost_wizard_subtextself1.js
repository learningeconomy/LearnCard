/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Subtextself1Inputs */

const en_boost_wizard_subtextself1 = /** @type {(inputs: Boost_Wizard_Subtextself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can issue yourself boosts to tell your story. Your skills are currencies for your future.`)
};

const es_boost_wizard_subtextself1 = /** @type {(inputs: Boost_Wizard_Subtextself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes emitirte boosts para contar tu historia. Tus habilidades son la moneda de tu futuro.`)
};

const fr_boost_wizard_subtextself1 = /** @type {(inputs: Boost_Wizard_Subtextself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez vous délivrer des boosts pour raconter votre histoire. Vos compétences sont la monnaie de votre avenir.`)
};

const ar_boost_wizard_subtextself1 = /** @type {(inputs: Boost_Wizard_Subtextself1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك منح نفسك تعزيزات لتروي قصتك. مهاراتك هي عملة مستقبلك.`)
};

/**
* | output |
* | --- |
* | "You can issue yourself boosts to tell your story. Your skills are currencies for your future." |
*
* @param {Boost_Wizard_Subtextself1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_subtextself1 = /** @type {((inputs?: Boost_Wizard_Subtextself1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Subtextself1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_subtextself1(inputs)
	if (locale === "es") return es_boost_wizard_subtextself1(inputs)
	if (locale === "fr") return fr_boost_wizard_subtextself1(inputs)
	return ar_boost_wizard_subtextself1(inputs)
});
export { boost_wizard_subtextself1 as "boost.wizard.subtextSelf" }