/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Approvedescription2Inputs */

const en_aiinsights_approvedescription2 = /** @type {(inputs: Aiinsights_Approvedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If you approve, your teacher will be able to see your Top Skills, Learning Snapshots, Suggested Pathways. They will also be able to send learning pathway suggestions to you.`)
};

const es_aiinsights_approvedescription2 = /** @type {(inputs: Aiinsights_Approvedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si lo apruebas, tu profesor podrá ver tus Habilidades Principales, Resúmenes de Aprendizaje y Rutas Sugeridas. También podrá enviarte sugerencias de rutas de aprendizaje.`)
};

const fr_aiinsights_approvedescription2 = /** @type {(inputs: Aiinsights_Approvedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si vous approuvez, votre enseignant pourra voir vos Compétences Principales, vos Aperçus d'Apprentissage et vos Parcours Suggérés. Il pourra également vous envoyer des suggestions de parcours d'apprentissage.`)
};

const ar_aiinsights_approvedescription2 = /** @type {(inputs: Aiinsights_Approvedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا وافقت، سيتمكن معلمك من رؤية أهم مهاراتك ولمحات تعلّمك والمسارات المقترحة. وسيتمكن أيضًا من إرسال اقتراحات مسارات التعلّم إليك.`)
};

/**
* | output |
* | --- |
* | "If you approve, your teacher will be able to see your Top Skills, Learning Snapshots, Suggested Pathways. They will also be able to send learning pathway sug..." |
*
* @param {Aiinsights_Approvedescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_approvedescription2 = /** @type {((inputs?: Aiinsights_Approvedescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Approvedescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_approvedescription2(inputs)
	if (locale === "es") return es_aiinsights_approvedescription2(inputs)
	if (locale === "fr") return fr_aiinsights_approvedescription2(inputs)
	return ar_aiinsights_approvedescription2(inputs)
});
export { aiinsights_approvedescription2 as "aiInsights.approveDescription" }