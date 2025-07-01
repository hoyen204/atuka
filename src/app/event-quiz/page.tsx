import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SearchForm from "./SearchForm";
import SSRPagination from "./SSRPagination";

interface ClanQuestion {
  id: number;
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchParams {
  search?: string;
  page?: string;
}

async function fetchQuestions(
  search: string = "",
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { question: { contains: search } },
          { answer: { contains: search } },
        ],
      }
    : {};

  const [questions, total] = await Promise.all([
    prisma.clanQuestion.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.clanQuestion.count({ where }),
  ]);

  return {
    data: questions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const formatDate = (date: Date) => {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return utcDate.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function handleSearch(formData: FormData) {
  "use server";

  const search = formData.get("search") as string;
  const searchParams = new URLSearchParams();

  if (search) {
    searchParams.set("search", search);
  }
  searchParams.set("page", "1");

  redirect(`/event-quiz?${searchParams.toString()}`);
}

async function handleClear() {
  "use server";
  redirect("/event-quiz");
}

interface EventQuizContentProps {
  searchParams: SearchParams;
}

async function EventQuizContent({ searchParams }: EventQuizContentProps) {
  const search = searchParams.search || "";
  const currentPage = parseInt(searchParams.page || "1");

  const { data: questions, pagination } = await fetchQuestions(
    search,
    currentPage
  );

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words text-center">
          Event Đua Top Tông Môn - ĐẠI THIÊN THẾ GIỚI
        </h1>
        <Badge
          variant="outline"
          className="text-xs md:text-sm self-start sm:self-auto whitespace-nowrap"
        >
          Tổng: {pagination.total} câu hỏi
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 w-full">
            <SearchForm
              defaultValue={search}
              onSearch={handleSearch}
              onClear={handleClear}
            />

            {search && questions.length === 1 && (
              <div className="flex w-full lg:flex-1 lg:ml-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                <div className="flex gap-2 md:gap-3 items-center ml-4">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 text-xs md:text-sm font-bold">
                        A
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs md:text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Đáp án:{" "}
                      <span className="text-sm md:text-lg font-semibold text-green-900 dark:text-green-100 leading-relaxed break-words overflow-wrap-anywhere">
                        {questions[0].answer}
                      </span>
                    </h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">
            Danh Sách Câu Hỏi & Đáp Án
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="hidden md:block rounded-md border">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead className="w-1/3">Câu Hỏi</TableHead>
                    <TableHead className="w-1/3">Đáp Án</TableHead>
                    <TableHead className="w-1/10 min-w-[120px]">
                      Cập Nhật
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không tìm thấy câu hỏi nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">
                          {question.id}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={question.question}>
                            {question.question}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div
                            className="truncate font-bold"
                            title={question.answer}
                          >
                            {question.answer}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(question.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="md:hidden w-full">
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Không tìm thấy câu hỏi nào
                </div>
              ) : (
                questions.map((question) => (
                  <Card
                    key={question.id}
                    className="p-3 border overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ID: {question.id}
                        </span>
                        <span className="text-xs text-muted-foreground text-right">
                          {formatDate(question.updatedAt)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Câu hỏi:
                        </p>
                        <p className="text-sm break-words overflow-wrap-anywhere">
                          {question.question}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Đáp án:</p>
                        <p className="text-sm font-bold break-words overflow-wrap-anywhere text-green-700 dark:text-green-400">
                          {question.answer}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 md:mt-6 w-full overflow-x-auto">
              <div className="min-w-fit flex justify-center">
                <SSRPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.limit}
                  total={pagination.total}
                  generatePageUrl={(page: number) => {
                    const searchParams = new URLSearchParams();
                    if (search) searchParams.set("search", search);
                    searchParams.set("page", page.toString());
                    return `/event-quiz?${searchParams.toString()}`;
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EventQuizPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <EventQuizContent searchParams={searchParams} />
    </Suspense>
  );
}
