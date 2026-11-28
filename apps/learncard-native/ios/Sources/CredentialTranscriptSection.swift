import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Read-only summary and entries from the original learner record.
struct CredentialTranscriptSection: View {
    @Environment(\.locale) private var locale
    let transcript: CredentialTranscript

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 12) {
            summary
            ForEach(Array(transcript.groups.enumerated()), id: \.offset) { index, group in
                if !group.records.isEmpty {
                    recordGroup(group, index: index)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("credential-transcript")
    }

    private var summary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "book.closed")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Palette.green)
                    .frame(width: 40, height: 40)
                    .background(Palette.surface, in: RoundedRectangle(cornerRadius: 12))
                    .accessibilityHidden(true)
                Text(NativeText.text(transcript.kind == "academic" ? "transcript.academic" : "transcript.general"))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Palette.ink)
                    .accessibilityAddTraits(.isHeader)
            }
            if let learner = transcript.learner, !learner.isEmpty {
                fact(NativeText.text("transcript.learner"), value: learner)
                    .accessibilityIdentifier("transcript-learner")
            }
            if transcript.groups.allSatisfy(\.records.isEmpty) {
                Text(NativeText.text("transcript.empty"))
                    .font(.subheadline)
                    .foregroundStyle(Palette.secondary)
                    .accessibilityIdentifier("transcript-empty")
            }
            if transcript.partial == true {
                Label(NativeText.text("transcript.partial"), systemImage: "info.circle")
                    .font(.footnote)
                    .foregroundStyle(Palette.secondary)
                    .accessibilityIdentifier("transcript-partial")
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.mint, in: RoundedRectangle(cornerRadius: 22))
    }

    private func recordGroup(_ group: CredentialTranscriptGroup, index: Int) -> some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            Text(group.term.flatMap { $0.isEmpty ? nil : $0 } ?? groupTitle(group.kind))
                .font(.headline)
                .foregroundStyle(Palette.ink)
                .padding(.bottom, 12)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("transcript-group-\(index)")
            ForEach(Array(group.records.enumerated()), id: \.offset) { recordIndex, record in
                Divider().overlay(Palette.line)
                recordRow(record)
                    .padding(.vertical, 12)
                    .accessibilityIdentifier("transcript-record-\(index)-\(recordIndex)")
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
    }

    private func groupTitle(_ kind: String) -> String {
        switch kind {
        case "courses": NativeText.text("transcript.courses")
        case "programs": NativeText.text("transcript.programs")
        default: NativeText.text("transcript.records")
        }
    }

    private func recordRow(_ record: CredentialTranscriptRecord) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(record.name)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if let code = record.code, !code.isEmpty {
                    Text(code)
                        .font(.footnote)
                        .foregroundStyle(Palette.secondary)
                }
            }
            if let credits = record.credits, let first = record.results.first {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .firstTextBaseline, spacing: 16) {
                        creditsFact(credits)
                        resultFact(first)
                    }.fixedSize(horizontal: true, vertical: false)
                    VStack(alignment: .leading, spacing: 6) {
                        creditsFact(credits)
                        resultFact(first)
                    }
                }
                ForEach(Array(record.results.dropFirst().enumerated()), id: \.offset) { _, result in
                    resultFact(result)
                }
            } else {
                if let credits = record.credits { creditsFact(credits) }
                ForEach(Array(record.results.enumerated()), id: \.offset) { _, result in
                    resultFact(result)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
    }

    private func creditsFact(_ credits: CredentialTranscriptCredits) -> some View {
        let quantity = credits.amount.formatted(.number.precision(.fractionLength(0...6)).locale(locale))
        let value = [quantity, credits.unit].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
        return fact(NativeText.text(credits.kind == "earned" ? "transcript.creditsEarned" : "transcript.creditsAvailable"), value: value)
    }

    private func resultFact(_ result: CredentialTranscriptResult) -> some View {
        let value = [result.value, result.status].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
        return fact(result.label ?? "", value: value)
    }

    private func fact(_ label: String, value: String) -> some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                factText(label, value: value)
            }.fixedSize(horizontal: true, vertical: false)
            VStack(alignment: .leading, spacing: 2) {
                factText(label, value: value)
            }
        }
        .font(.footnote)
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder private func factText(_ label: String, value: String) -> some View {
        if !label.isEmpty {
            Text(label).foregroundStyle(Palette.secondary)
        }
        if !value.isEmpty {
            Text(value).fontWeight(.semibold).foregroundStyle(Palette.ink)
        }
    }
}
