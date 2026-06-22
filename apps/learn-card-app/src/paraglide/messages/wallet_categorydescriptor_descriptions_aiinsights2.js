/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs */

const en_wallet_categorydescriptor_descriptions_aiinsights2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insights are intelligent summaries generated from an individual's verified credentials, skills, learning experiences, and achievements. They provide a clear, holistic view of a learner's progress by analyzing authenticated data to identify strengths, highlight growth areas, and reveal meaningful patterns over time. These insights help learners understand their development, support educators in guiding their students, and enable more informed decisions around learning pathways and future opportunities.`)
};

const es_wallet_categorydescriptor_descriptions_aiinsights2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las perspectivas de IA son resúmenes inteligentes generados a partir de las credenciales verificadas, las habilidades, las experiencias de aprendizaje y los logros de una persona. Ofrecen una visión clara e integral del progreso del estudiante analizando datos autenticados para identificar fortalezas, destacar áreas de crecimiento y revelar patrones significativos a lo largo del tiempo. Estas perspectivas ayudan a los estudiantes a comprender su desarrollo, apoyan a los educadores en la orientación de sus alumnos y permiten tomar decisiones más informadas sobre las trayectorias de aprendizaje y las oportunidades futuras.`)
};

const fr_wallet_categorydescriptor_descriptions_aiinsights2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les analyses d'IA sont des résumés intelligents générés à partir des justificatifs vérifiés, des compétences, des expériences d'apprentissage et des réussites d'une personne. Elles offrent une vision claire et globale de la progression de l'apprenant en analysant des données authentifiées afin d'identifier les points forts, de mettre en évidence les axes de progression et de révéler des tendances significatives au fil du temps. Ces analyses aident les apprenants à comprendre leur évolution, soutiennent les éducateurs dans l'accompagnement de leurs élèves et permettent de prendre des décisions plus éclairées concernant les parcours d'apprentissage et les opportunités futures.`)
};

const ar_wallet_categorydescriptor_descriptions_aiinsights2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى الذكاء الاصطناعي هي ملخّصات ذكية تُولَّد من بيانات اعتماد الفرد الموثّقة ومهاراته وتجارب تعلّمه وإنجازاته. وهي توفّر رؤية واضحة وشاملة لتقدّم المتعلّم عبر تحليل البيانات الموثّقة لتحديد نقاط القوة وإبراز مجالات النموّ والكشف عن أنماط ذات مغزى عبر الزمن. وتساعد هذه الرؤى المتعلّمين على فهم تطوّرهم، وتدعم المعلّمين في توجيه طلابهم، وتتيح اتخاذ قرارات أكثر استنارة بشأن مسارات التعلّم والفرص المستقبلية.`)
};

/**
* | output |
* | --- |
* | "AI Insights are intelligent summaries generated from an individual's verified credentials, skills, learning experiences, and achievements. They provide a cle..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_aiinsights2 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Aiinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_aiinsights2(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_aiinsights2(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_aiinsights2(inputs)
	return ar_wallet_categorydescriptor_descriptions_aiinsights2(inputs)
});
export { wallet_categorydescriptor_descriptions_aiinsights2 as "wallet.categoryDescriptor.descriptions.aiInsights" }