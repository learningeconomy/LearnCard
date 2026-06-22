/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Betapreviewdesc4Inputs */

const en_developerportal_components_betagate_betapreviewdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is pre-release functionality. Features may change, and you may encounter bugs. Your feedback is valuable!`)
};

const es_developerportal_components_betagate_betapreviewdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta es una funcionalidad de prelanzamiento. Las funciones pueden cambiar y puedes encontrar errores. ¡Tus comentarios son valiosos!`)
};

const fr_developerportal_components_betagate_betapreviewdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ceci est une fonctionnalité de pré-lancement. Les fonctionnalités peuvent changer et vous pouvez rencontrer des bugs. Vos commentaires sont précieux !`)
};

const ar_developerportal_components_betagate_betapreviewdesc4 = /** @type {(inputs: Developerportal_Components_Betagate_Betapreviewdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه وظيفة ما قبل الإصدار. قد تتغير الميزات وقد تواجه أخطاء. ملاحظاتك قيمة!`)
};

/**
* | output |
* | --- |
* | "This is pre-release functionality. Features may change, and you may encounter bugs. Your feedback is valuable!" |
*
* @param {Developerportal_Components_Betagate_Betapreviewdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_betapreviewdesc4 = /** @type {((inputs?: Developerportal_Components_Betagate_Betapreviewdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Betapreviewdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_betapreviewdesc4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_betapreviewdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_betapreviewdesc4(inputs)
	return ar_developerportal_components_betagate_betapreviewdesc4(inputs)
});
export { developerportal_components_betagate_betapreviewdesc4 as "developerPortal.components.betaGate.betaPreviewDesc" }