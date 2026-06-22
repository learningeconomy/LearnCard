/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Maindescription2Inputs */

const en_developerportal_guides_hub_maindescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Maindescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose what you want to build. We'll guide you through each step with ready-to-use code and live setup tools.`)
};

const es_developerportal_guides_hub_maindescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Maindescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige lo que quieres construir. Te guiaremos en cada paso con código listo para usar y herramientas de configuración en vivo.`)
};

const fr_developerportal_guides_hub_maindescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Maindescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez ce que vous voulez construire. Nous vous guiderons à chaque étape avec du code prêt à l'emploi et des outils de configuration en direct.`)
};

const ar_developerportal_guides_hub_maindescription2 = /** @type {(inputs: Developerportal_Guides_Hub_Maindescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ما تريد بناءه. سنرشدك خلال كل خطوة بكود جاهز للاستخدام وأدوات إعداد مباشرة.`)
};

/**
* | output |
* | --- |
* | "Choose what you want to build. We'll guide you through each step with ready-to-use code and live setup tools." |
*
* @param {Developerportal_Guides_Hub_Maindescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_maindescription2 = /** @type {((inputs?: Developerportal_Guides_Hub_Maindescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Maindescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_maindescription2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_maindescription2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_maindescription2(inputs)
	return ar_developerportal_guides_hub_maindescription2(inputs)
});
export { developerportal_guides_hub_maindescription2 as "developerPortal.guides.hub.mainDescription" }