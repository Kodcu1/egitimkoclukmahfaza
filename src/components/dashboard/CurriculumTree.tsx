import React, { useState, useEffect } from 'react';
import { getCurriculumForExam, MULTI_EXAM_CURRICULUM_REGISTRY } from '../../data/multiExamCurriculum';
import { ExamType, TargetExamGroup } from '../../types';
import { Select } from '../common/Select';
import { BookOpen, Layers } from 'lucide-react';

export interface CurriculumSelection {
  examType: ExamType;
  testName: string;
  subjectName: string;
  topicName: string;
  subtopicName?: string;
}

interface CurriculumTreeProps {
  initialExam?: ExamType;
  targetExam?: TargetExamGroup | string;
  initialSubject?: string;
  initialTopic?: string;
  initialSubtopic?: string;
  onChange: (selection: CurriculumSelection) => void;
}

export const CurriculumTree: React.FC<CurriculumTreeProps> = ({
  initialExam,
  targetExam,
  initialSubject,
  initialTopic,
  initialSubtopic,
  onChange,
}) => {
  // Determine default examType based on targetExam or initialExam
  const defaultExamType: ExamType = (initialExam || (targetExam === 'LGS' ? 'LGS' : targetExam === 'KPSS' ? 'KPSS_GYGK' : 'TYT')) as ExamType;
  const [examType, setExamType] = useState<ExamType>(defaultExamType);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');

  // When targetExam prop changes, update examType if needed
  useEffect(() => {
    if (targetExam === 'LGS' && examType !== 'LGS') {
      setExamType('LGS');
    } else if (targetExam === 'KPSS' && !examType.startsWith('KPSS')) {
      setExamType('KPSS_GYGK');
    }
  }, [targetExam]);

  const currentExam = getCurriculumForExam(examType);
  const tests = currentExam?.tests || [];

  // Reset or initialize test when exam changes
  useEffect(() => {
    if (tests.length > 0) {
      setSelectedTestId(tests[0].id);
    }
  }, [examType, tests.length]);

  const currentTest = tests.find((t) => t.id === selectedTestId) || tests[0];
  const subjects = currentTest?.subjects || [];

  // Reset or initialize subject when test changes
  useEffect(() => {
    if (subjects.length > 0) {
      const match = initialSubject
        ? subjects.find((s) => s.name.toLowerCase() === initialSubject.toLowerCase())
        : null;
      setSelectedSubjectId(match ? match.id : subjects[0].id);
    }
  }, [selectedTestId, subjects]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const topics = currentSubject?.topics || [];

  // Reset or initialize topic when subject changes
  useEffect(() => {
    if (topics.length > 0) {
      const match = initialTopic
        ? topics.find((t) => t.name.toLowerCase() === initialTopic.toLowerCase())
        : null;
      setSelectedTopicId(match ? match.id : topics[0].id);
    }
  }, [selectedSubjectId, topics]);

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const subtopics = currentTopic?.subtopics || [];

  // Reset subtopic when topic changes
  useEffect(() => {
    if (subtopics.length > 0) {
      setSelectedSubtopic(initialSubtopic && subtopics.includes(initialSubtopic) ? initialSubtopic : subtopics[0]);
    } else {
      setSelectedSubtopic('');
    }
  }, [selectedTopicId, subtopics]);

  // Propagate changes to parent
  useEffect(() => {
    if (currentExam && currentTest && currentSubject && currentTopic) {
      onChange({
        examType,
        testName: currentTest.name,
        subjectName: currentSubject.name,
        topicName: currentTopic.name,
        subtopicName: selectedSubtopic || undefined,
      });
    }
  }, [examType, selectedTestId, selectedSubjectId, selectedTopicId, selectedSubtopic]);

  const isLockedToLGS = targetExam === 'LGS';
  const isLockedToKPSS = targetExam === 'KPSS';

  return (
    <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>
            {isLockedToLGS ? 'LGS MEB Müfredatı (6 Temel Ders)' : isLockedToKPSS ? 'KPSS Genel Yetenek - Genel Kültür Müfredatı' : 'Müfredat Seçimi (Kademeli Hiyerarşi)'}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
          {examType}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Sınav Türü */}
        <Select
          label="1. Sınav Grubu / Türü"
          value={examType}
          disabled={isLockedToLGS || isLockedToKPSS}
          onChange={(e) => setExamType(e.target.value as ExamType)}
        >
          {!targetExam || targetExam === 'YKS' ? (
            <>
              <option value="TYT">TYT (Temel Yeterlilik)</option>
              <option value="AYT">AYT (Alan Yeterlilik)</option>
            </>
          ) : null}
          {!targetExam || targetExam === 'LGS' ? (
            <option value="LGS">LGS (Liselere Geçiş - 6 MEB Dersi)</option>
          ) : null}
          {!targetExam || targetExam === 'KPSS' ? (
            <option value="KPSS_GYGK">KPSS (Genel Yetenek & Genel Kültür)</option>
          ) : null}
        </Select>

        {/* 2. Ders */}
        <Select
          label="2. Ders"
          value={selectedSubjectId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedSubjectId(val);
            // Also find test that contains this subject
            const foundTest = tests.find((t) => t.subjects.some((s) => s.id === val));
            if (foundTest) setSelectedTestId(foundTest.id);
          }}
        >
          {tests.flatMap((t) =>
            t.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({t.name.split(' ')[0]})
              </option>
            ))
          )}
        </Select>

        {/* 3. Konu */}
        <Select
          label="3. Konu"
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
        >
          {topics.map((top) => (
            <option key={top.id} value={top.id}>
              {top.name}
            </option>
          ))}
        </Select>

        {/* 4. Alt Konu */}
        <Select
          label="4. Alt Konu / Kazanım"
          value={selectedSubtopic}
          onChange={(e) => setSelectedSubtopic(e.target.value)}
          disabled={subtopics.length === 0}
        >
          {subtopics.length > 0 ? (
            subtopics.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))
          ) : (
            <option value="">Genel Konu Tekrarı</option>
          )}
        </Select>
      </div>
    </div>
  );
};
