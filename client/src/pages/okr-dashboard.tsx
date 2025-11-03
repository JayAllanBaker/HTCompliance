import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Objective, KeyResult, CheckIn, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import CheckInDialog from "@/components/okr/check-in-dialog";
import { Target, TrendingUp, Plus, ChevronDown, ChevronUp, Circle, AlertCircle, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

// Extended types for OKR data with relations
interface ObjectiveWithRelations extends Objective {
  owner?: User | null;
  keyResults?: KeyResult[];
  latestCheckIn?: CheckIn | null;
}

interface AutoMetrics {
  onTimeRate: number;
  lateFees: number;
  leadTime: number;
  contractCoverage: number;
}

const TIMEFRAMES = [
  "Q1 FY26",
  "Q2 FY26",
  "Q3 FY26",
  "Q4 FY26",
  "Q1 FY27",
  "Q2 FY27",
  "Q3 FY27",
  "Q4 FY27",
];

export default function OKRDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("Q1 FY26");

  // Fetch auto-calculated metrics
  const { data: autoMetrics, isLoading: metricsLoading } = useQuery<AutoMetrics>({
    queryKey: ["/api/okr/auto-metrics"],
  });

  // Fetch objectives for selected timeframe
  const { data: objectives, isLoading: objectivesLoading } = useQuery<ObjectiveWithRelations[]>({
    queryKey: ["/api/objectives", selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/objectives?timeframe=${encodeURIComponent(selectedTimeframe)}&isActive=true`);
      if (!response.ok) throw new Error("Failed to fetch objectives");
      return response.json();
    },
  });

  // Fetch key results for all objectives
  const { data: allKeyResults } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
    enabled: !!objectives && objectives.length > 0,
  });

  // Fetch check-ins for objectives
  const { data: allCheckIns } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins"],
    enabled: !!objectives && objectives.length > 0,
  });

  // Fetch users for owner names
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calculate average KR scoring for an objective
  const calculateAverageScore = (objectiveId: string): number => {
    const krs = allKeyResults?.filter((kr) => kr.objectiveId === objectiveId) || [];
    if (krs.length === 0) return 0;
    const totalScore = krs.reduce((sum, kr) => sum + parseFloat(kr.scoring || "0"), 0);
    return totalScore / krs.length;
  };

  // Get latest check-in for an objective
  const getLatestCheckIn = (objectiveId: string): CheckIn | null => {
    const checkIns = allCheckIns?.filter((ci) => ci.objectiveId === objectiveId) || [];
    if (checkIns.length === 0) return null;
    return checkIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  // Get owner name
  const getOwnerName = (ownerId: string | null): string => {
    if (!ownerId) return "Unassigned";
    const owner = users?.find((u) => u.id === ownerId);
    return owner?.fullName || owner?.username || "Unknown";
  };

  // Get scoring color
  const getScoringColor = (score: number): string => {
    if (score >= 0.7) return "text-green-600 dark:text-green-400";
    if (score >= 0.3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Get confidence badge variant
  const getConfidenceBadgeVariant = (confidence: string): "default" | "secondary" | "destructive" => {
    if (confidence === "green") return "default";
    if (confidence === "yellow") return "secondary";
    return "destructive";
  };

  // Get confidence color
  const getConfidenceColor = (confidence: string): string => {
    if (confidence === "green") return "bg-green-500";
    if (confidence === "yellow") return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate progress percentage for a key result
  const calculateProgress = (kr: KeyResult): number => {
    const current = parseFloat(kr.current || "0");
    const target = parseFloat(kr.target || "1");
    const baseline = parseFloat(kr.baseline || "0");
    
    if (target === baseline) return 0;
    const progress = ((current - baseline) / (target - baseline)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 overflow-auto bg-muted/30 min-h-screen">
        <div className="p-6">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight" data-testid="text-okr-dashboard-title">
                Measure What Matters - OKR Dashboard
              </h2>
              <p className="text-muted-foreground mt-1">
                Track objectives and key results across your organization
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-48" data-testid="select-timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-create-objective"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Objective
              </Button>
            </div>
          </div>

          {/* Auto-Calculated Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metricsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card data-testid="metric-on-time-rate">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      On-Time Rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {autoMetrics?.onTimeRate?.toFixed(1) || 0}%
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="metric-late-fees">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Late Fees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${autoMetrics?.lateFees?.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="metric-lead-time">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Lead Time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {autoMetrics?.leadTime?.toFixed(1) || 0} days
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="metric-contract-coverage">
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Contract Coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {autoMetrics?.contractCoverage?.toFixed(1) || 0}%
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Objectives List */}
          <div className="space-y-6">
            {objectivesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : objectives && objectives.length > 0 ? (
              objectives.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  keyResults={allKeyResults?.filter((kr) => kr.objectiveId === objective.id) || []}
                  checkIns={allCheckIns?.filter((ci) => ci.objectiveId === objective.id) || []}
                  latestCheckIn={getLatestCheckIn(objective.id)}
                  ownerName={getOwnerName(objective.ownerId)}
                  averageScore={calculateAverageScore(objective.id)}
                  getScoringColor={getScoringColor}
                  getConfidenceBadgeVariant={getConfidenceBadgeVariant}
                  getConfidenceColor={getConfidenceColor}
                  calculateProgress={calculateProgress}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No objectives found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first objective for {selectedTimeframe} to get started
                  </p>
                  <Button data-testid="button-create-first-objective">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Objective
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Objective Card Component
interface ObjectiveCardProps {
  objective: Objective;
  keyResults: KeyResult[];
  checkIns: CheckIn[];
  latestCheckIn: CheckIn | null;
  ownerName: string;
  averageScore: number;
  getScoringColor: (score: number) => string;
  getConfidenceBadgeVariant: (confidence: string) => "default" | "secondary" | "destructive";
  getConfidenceColor: (confidence: string) => string;
  calculateProgress: (kr: KeyResult) => number;
}

function ObjectiveCard({
  objective,
  keyResults,
  checkIns,
  latestCheckIn,
  ownerName,
  averageScore,
  getScoringColor,
  getConfidenceBadgeVariant,
  getConfidenceColor,
  calculateProgress,
}: ObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [showCheckInHistory, setShowCheckInHistory] = useState(false);

  // Sort check-ins by date descending
  const sortedCheckIns = [...checkIns].sort(
    (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime()
  );

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow" data-testid={`objective-card-${objective.id}`}>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{objective.title}</CardTitle>
                  <Badge variant="outline" data-testid={`timeframe-badge-${objective.id}`}>
                    {objective.timeframe}
                  </Badge>
                  {latestCheckIn && (
                    <div className="flex items-center gap-2">
                      <Circle
                        className={`w-3 h-3 ${getConfidenceColor(latestCheckIn.confidence)} rounded-full fill-current`}
                        data-testid={`confidence-indicator-${objective.id}`}
                      />
                      <span className="text-sm text-muted-foreground capitalize">
                        {latestCheckIn.confidence}
                      </span>
                    </div>
                  )}
                </div>
                {objective.description && (
                  <CardDescription className="mt-2">{objective.description}</CardDescription>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span data-testid={`owner-name-${objective.id}`}>Owner: {ownerName}</span>
                  <span className={`font-semibold ${getScoringColor(averageScore)}`} data-testid={`avg-score-${objective.id}`}>
                    Score: {(averageScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCheckInDialogOpen(true)}
                  data-testid={`button-add-check-in-${objective.id}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Check-In
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`expand-button-${objective.id}`}>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

        <CardContent>
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {(averageScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={averageScore * 100} className="h-2" data-testid={`progress-${objective.id}`} />
          </div>

          {/* Key Results Preview (first 2) */}
          {!isExpanded && keyResults.length > 0 && (
            <div className="space-y-3">
              {keyResults.slice(0, 2).map((kr) => (
                <KeyResultItem key={kr.id} kr={kr} calculateProgress={calculateProgress} getScoringColor={getScoringColor} />
              ))}
              {keyResults.length > 2 && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  +{keyResults.length - 2} more key results
                </div>
              )}
            </div>
          )}

          {/* Expanded Key Results */}
          <CollapsibleContent>
            <div className="space-y-3 pt-2">
              {keyResults.map((kr) => (
                <KeyResultItem key={kr.id} kr={kr} calculateProgress={calculateProgress} getScoringColor={getScoringColor} />
              ))}
              {keyResults.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No key results defined yet
                </div>
              )}
            </div>
          </CollapsibleContent>

          {/* Latest Check-In Display */}
          {latestCheckIn && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Latest Check-In</h4>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(latestCheckIn.weekOf), "MMM d, yyyy")}
                </span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                {latestCheckIn.progressNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Progress:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {latestCheckIn.progressNotes}
                    </p>
                  </div>
                )}
                {checkIns.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCheckInHistory(!showCheckInHistory)}
                    className="w-full mt-2"
                    data-testid={`button-toggle-check-in-history-${objective.id}`}
                  >
                    {showCheckInHistory ? "Hide" : "Show"} Full History ({checkIns.length} check-ins)
                    {showCheckInHistory ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                )}
              </div>

              {/* Check-In History */}
              {showCheckInHistory && checkIns.length > 1 && (
                <div className="mt-4 space-y-3">
                  <Separator />
                  <h4 className="text-sm font-semibold">Check-In History</h4>
                  {sortedCheckIns.slice(1).map((checkIn, index) => (
                    <div
                      key={checkIn.id}
                      className="bg-muted/30 rounded-lg p-3 space-y-2"
                      data-testid={`check-in-history-${checkIn.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Circle
                            className={`w-3 h-3 ${getConfidenceColor(checkIn.confidence)} rounded-full fill-current`}
                          />
                          <span className="text-xs font-medium capitalize">
                            {checkIn.confidence}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(checkIn.weekOf), "MMM d, yyyy")}
                        </span>
                      </div>
                      {checkIn.progressNotes && (
                        <p className="text-xs text-muted-foreground">
                          {checkIn.progressNotes}
                        </p>
                      )}
                      {checkIn.risks && (
                        <div className="text-xs">
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            Risks:
                          </span>{" "}
                          {checkIn.risks}
                        </div>
                      )}
                      {checkIn.nextWeekPlan && (
                        <div className="text-xs">
                          <span className="font-medium">Plan:</span> {checkIn.nextWeekPlan}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Collapsible>
    </Card>

    {/* Check-In Dialog */}
    <CheckInDialog
      objectiveId={objective.id}
      objectiveTitle={objective.title}
      open={isCheckInDialogOpen}
      onOpenChange={setIsCheckInDialogOpen}
      onSuccess={() => {
        // Dialog will handle cache invalidation
      }}
    />
    </>
  );
}

// Key Result Item Component
interface KeyResultItemProps {
  kr: KeyResult;
  calculateProgress: (kr: KeyResult) => number;
  getScoringColor: (score: number) => string;
}

function KeyResultItem({ kr, calculateProgress, getScoringColor }: KeyResultItemProps) {
  const progress = calculateProgress(kr);
  const scoring = parseFloat(kr.scoring || "0");

  return (
    <div className="bg-muted/50 rounded-lg p-3" data-testid={`key-result-${kr.id}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{kr.title}</span>
            {kr.isAutoCalculated && (
              <Badge variant="secondary" className="text-xs" data-testid={`auto-badge-${kr.id}`}>
                Auto
              </Badge>
            )}
          </div>
        </div>
        <span className={`text-sm font-semibold ${getScoringColor(scoring)}`} data-testid={`scoring-${kr.id}`}>
          {(scoring * 100).toFixed(0)}%
        </span>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="h-2" data-testid={`kr-progress-${kr.id}`} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Current: {parseFloat(kr.current || "0").toFixed(1)} {kr.unit}
          </span>
          <span>
            Target: {parseFloat(kr.target || "0").toFixed(1)} {kr.unit}
          </span>
        </div>
        {kr.baseline && (
          <div className="text-xs text-muted-foreground">
            Baseline: {parseFloat(kr.baseline).toFixed(1)} {kr.unit}
          </div>
        )}
      </div>
    </div>
  );
}
