/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Components_Betagate_Guidelockedtitle4Inputs */

const en_developerportal_components_betagate_guidelockedtitle4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockedtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name}`)
};

const es_developerportal_components_betagate_guidelockedtitle4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockedtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name}`)
};

const fr_developerportal_components_betagate_guidelockedtitle4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockedtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name}`)
};

const ar_developerportal_components_betagate_guidelockedtitle4 = /** @type {(inputs: Developerportal_Components_Betagate_Guidelockedtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name}`)
};

/**
* | output |
* | --- |
* | "{name}" |
*
* @param {Developerportal_Components_Betagate_Guidelockedtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_guidelockedtitle4 = /** @type {((inputs: Developerportal_Components_Betagate_Guidelockedtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Guidelockedtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_guidelockedtitle4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_guidelockedtitle4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_guidelockedtitle4(inputs)
	return ar_developerportal_components_betagate_guidelockedtitle4(inputs)
});
export { developerportal_components_betagate_guidelockedtitle4 as "developerPortal.components.betaGate.guideLockedTitle" }