import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  Building2, 
  FileText, 
  Calendar, 
  DollarSign, 
  Shield, 
  Download, 
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Link as LinkIcon,
  Target
} from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      description: "Learn the basics of BizGov",
      content: [
        {
          question: "How do I log in for the first time?",
          answer: (
            <div className="space-y-3">
              <p><strong>Default Admin Credentials (Docker):</strong></p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <div>Username: <span className="text-primary">admin</span></div>
                <div>Password: <span className="text-primary">admin123</span></div>
              </div>
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">IMPORTANT: Change this password immediately after first login!</p>
              </div>
            </div>
          )
        },
        {
          question: "What does the Dashboard show?",
          answer: (
            <div className="space-y-3">
              <p>The dashboard displays key compliance metrics with clickable KPI cards:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Compliance Rate</strong> - Percentage of items completed on time (click to view all items)</li>
                <li><strong>Overdue Items</strong> - Items past their due date (click to filter overdue)</li>
                <li><strong>Due This Week</strong> - Items due within 7 days (click to filter upcoming)</li>
                <li><strong>Total Items</strong> - All compliance obligations tracked (click to view all)</li>
              </ul>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Click any KPI card to navigate to the Compliance page with the relevant filter applied.</p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "okr-dashboard",
      title: "OKR Dashboard (Measure What Matters)",
      icon: Target,
      description: "Track strategic objectives and key results",
      content: [
        {
          question: "What is the OKR Dashboard?",
          answer: (
            <div className="space-y-3">
              <p>The OKR (Objectives and Key Results) Dashboard connects compliance activities to strategic business outcomes. It helps track progress toward organizational goals using a proven framework.</p>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Key Features:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Auto-Calculated Metrics</strong> - Four key metrics automatically derived from compliance and contract data</li>
                  <li><strong>Objective Tracking</strong> - Monitor strategic objectives with progress bars and confidence indicators</li>
                  <li><strong>Key Results</strong> - Track measurable outcomes with scoring (0-1.0 scale)</li>
                  <li><strong>Weekly Check-Ins</strong> - Record progress updates with confidence ratings</li>
                  <li><strong>Timeframe Filtering</strong> - View objectives by quarter (Q1-Q4 FY26, etc.)</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          question: "How do I create an objective?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"OKR Dashboard"</strong> in the sidebar</li>
                <li>Click <strong>"Create Objective"</strong> button (top right)</li>
                <li>Enter objective details:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Title</strong> - Your strategic objective (e.g., "Eliminate missed filings")</li>
                    <li><strong>Description</strong> - What success looks like</li>
                    <li><strong>Timeframe</strong> - Quarter (auto-filled with current selection)</li>
                    <li><strong>Owner</strong> - Team member responsible (optional)</li>
                  </ul>
                </li>
                <li>Click <strong>"Create Objective"</strong></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2 mt-3">
                <p className="font-semibold">Example:</p>
                <div className="text-sm space-y-1">
                  <div>Title: <span className="font-mono">Make payroll compliance fully reliable</span></div>
                  <div>Description: <span className="font-mono">Complete 100% of payroll cycles on time with zero penalties</span></div>
                  <div>Timeframe: <span className="font-mono">Q1 FY26</span></div>
                  <div>Owner: <span className="font-mono">Finance Team Lead</span></div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: "What are Auto-Calculated Metrics?",
          answer: (
            <div className="space-y-3">
              <p>The OKR Dashboard automatically calculates four key metrics from your existing compliance and contract data:</p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>On-Time Rate (%)</strong> - Percentage of compliance items completed before due date</li>
                <li><strong>Late Fees ($)</strong> - Total penalties from missed deadlines</li>
                <li><strong>Lead Time (days)</strong> - Average time from alert to completion</li>
                <li><strong>Contract Coverage (%)</strong> - Percentage of contracts with structured metadata</li>
              </ul>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md mt-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">These metrics update in real-time as you complete compliance tasks and add contracts - no manual entry required!</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I record a weekly check-in?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Find your objective on the OKR Dashboard</li>
                <li>Click <strong>"Add Check-In"</strong> button</li>
                <li>Fill in the check-in form:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Week Of</strong> - Date picker (defaults to current Monday)</li>
                    <li><strong>Confidence</strong> - Green (on track), Yellow (at risk), Red (off track)</li>
                    <li><strong>Progress Notes</strong> - What you accomplished this week</li>
                    <li><strong>Risks and Blockers</strong> - Current challenges</li>
                    <li><strong>Next Week Plan</strong> - What you'll work on</li>
                  </ul>
                </li>
                <li>Click <strong>"Create Check-In"</strong></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2 mt-3">
                <p className="font-semibold">Confidence Indicators:</p>
                <ul className="space-y-1 text-sm">
                  <li><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span><strong>Green</strong> - Everything is going according to plan</li>
                  <li><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span><strong>Yellow</strong> - Some challenges, but manageable</li>
                  <li><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span><strong>Red</strong> - Significant blockers or delays</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          question: "What is the scoring system for Key Results?",
          answer: (
            <div className="space-y-3">
              <p>Key Results use a 0-1.0 scoring scale with color-coded performance indicators:</p>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-600">0.0 - 0.3</span>
                    <span>RED - Off track: Significant gaps or blockers preventing progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-yellow-600">0.3 - 0.7</span>
                    <span>YELLOW - At risk: Making progress but may not hit target</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">0.7 - 1.0</span>
                    <span>GREEN - On track: Strong progress toward target</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Scoring of 0.7-0.8 is considered excellent - OKRs should be ambitious and stretch your capabilities!</p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "organizations",
      title: "Organization Management",
      icon: Building2,
      description: "Manage customer organizations",
      content: [
        {
          question: "How do I create a new organization?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Organizations"</strong> in the left sidebar</li>
                <li>Click <strong>"Add Organization"</strong> button (top right)</li>
                <li>Fill in the form with required information</li>
                <li>Click <strong>"Create Organization"</strong></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Example:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Name:</div>
                  <div className="font-mono">The Alliance Health Network</div>
                  <div>Code:</div>
                  <div className="font-mono">ALLIANCE</div>
                  <div>Contact Email:</div>
                  <div className="font-mono">admin@thealliance.health</div>
                  <div>Active:</div>
                  <div className="text-green-600">✓ Yes</div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: "Why can't I delete an organization?",
          answer: (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>You cannot delete organizations that have linked compliance items or contracts. Remove all linked data first, then try deleting again.</p>
            </div>
          )
        },
        {
          question: "What are Organization Types and how are they color-coded?",
          answer: (
            <div className="space-y-3">
              <p>Organizations can be classified by type to help you quickly identify their relationship to your business. Each type has a distinctive color code displayed throughout the application:</p>
              
              <div className="bg-muted p-4 rounded-md space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                    <div>
                      <strong>Customer</strong> - Organizations that purchase your services or products
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                    <div>
                      <strong>Vendor</strong> - External suppliers or service providers
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    <div>
                      <strong>Contractor</strong> - Independent contractors or consultants
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-gray-500 rounded-full"></span>
                    <div>
                      <strong>Internal</strong> - Your own organization or departments
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <div>
                      <strong>State Government</strong> - State-level government agencies
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                    <div>
                      <strong>Federal Government</strong> - Federal agencies or departments
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Color Coding Benefits:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Quickly identify organization types at a glance</li>
                    <li>Colors appear consistently across all pages (Organizations, Contracts, Compliance, etc.)</li>
                    <li>Helps you organize and filter by relationship type</li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">Set the organization type when creating or editing an organization. The color badge will appear next to the organization name throughout the application.</p>
            </div>
          )
        }
      ]
    },
    {
      id: "contracts",
      title: "Contract Management",
      icon: FileText,
      description: "Track agreements and obligations",
      content: [
        {
          question: "How do I create a contract?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Contracts"</strong> in the sidebar</li>
                <li>Click <strong>"Add Contract"</strong> button</li>
                <li>Select the organization from dropdown</li>
                <li>Enter contract details (title, dates, amount)</li>
                <li>Click <strong>"Create Contract"</strong></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Example Contract:</p>
                <div className="text-sm space-y-1">
                  <div>Organization: <span className="font-mono">ABC Healthcare Partners</span></div>
                  <div>Title: <span className="font-mono">Professional Services - SOW1</span></div>
                  <div>Start Date: <span className="font-mono">07/01/2025</span></div>
                  <div>End Date: <span className="font-mono">12/31/2025</span></div>
                  <div>Max Amount: <span className="font-mono text-green-600">$251,160.00</span></div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "compliance",
      title: "Compliance Tracking",
      icon: Calendar,
      description: "Track obligations and deadlines",
      content: [
        {
          question: "How do I add a compliance item?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Compliance"</strong> in the sidebar</li>
                <li>Click <strong>"Add Compliance Item"</strong> button</li>
                <li>Select the organization</li>
                <li>Choose category (Marketing Agreement, Billing, Deliverable, etc.)</li>
                <li>Fill in commitment details and responsible party</li>
                <li>Set due date and status</li>
                <li>Optionally link to a contract</li>
                <li>Click <strong>"Create"</strong></li>
              </ol>
            </div>
          )
        },
        {
          question: "How do I bulk import compliance items?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Compliance"</strong> → <strong>"CSV Template"</strong> to download the template with format specification</li>
                <li>Open the downloaded CSV template in Excel or text editor</li>
                <li>Fill in your compliance data following the format (see Required Fields below)</li>
                <li>Save the file as CSV (UTF-8 encoding recommended)</li>
                <li>Click <strong>"Import CSV"</strong> and select your file</li>
                <li>Review validation results - errors will show specific row numbers</li>
                <li>Valid items are automatically created</li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-3">
                <p className="font-semibold">Required CSV Columns:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Category</strong> (required): Marketing Agreement, Billing, Deliverable, Compliance, or End-of-Term</li>
                  <li><strong>Type</strong> (optional): Free text subcategory</li>
                  <li><strong>Commitment</strong> (required): The compliance obligation title</li>
                  <li><strong>Description</strong> (optional): Detailed description</li>
                  <li><strong>Responsible Party</strong> (required): Person or team responsible</li>
                  <li><strong>Status</strong> (required): pending, complete, overdue, or na (case-insensitive)</li>
                  <li><strong>Due Date</strong> (optional): MM/DD/YYYY or YYYY-MM-DD format</li>
                  <li><strong>Customer</strong> (optional): Organization name/code (defaults to CCAH)</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Format Specification:</p>
                  <p>The CSV Template button downloads a pre-formatted file with examples. A complete JSON format specification is available at <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/csv/spec</code> with validation rules, examples, and error handling details.</p>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold mb-2">Example CSV Header:</p>
                <p className="text-sm font-mono overflow-x-auto">
                  Category,Type,Commitment,Description,Responsible Party,Status,Due Date,Customer
                </p>
              </div>
            </div>
          )
        },
        {
          question: "How do I update compliance status?",
          answer: (
            <div className="space-y-3">
              <p><strong>Method 1 - Quick Status Toggle:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Find the item in the list</li>
                <li>Click the status badge</li>
                <li>Select new status</li>
                <li>Completion date auto-populates if marked "Complete"</li>
              </ol>
              
              <p><strong>Method 2 - Full Edit:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click the pencil icon on the item</li>
                <li>Update any fields needed</li>
                <li>Change status if applicable</li>
                <li>Click <strong>"Update"</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Items automatically change to "overdue" status when the due date passes and they're not marked complete.</p>
              </div>
            </div>
          )
        },
        {
          question: "What are Compliance Types and how do I use them?",
          answer: (
            <div className="space-y-3">
              <p>When creating a compliance item, you can select from 11 predefined compliance types for consistent categorization:</p>
              
              <div className="bg-muted p-4 rounded-md">
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  <li>• Regulatory Filing</li>
                  <li>• Audit</li>
                  <li>• Certification</li>
                  <li>• License Renewal</li>
                  <li>• Training</li>
                  <li>• Report Submission</li>
                  <li>• Inspection</li>
                  <li>• Review</li>
                  <li>• Assessment</li>
                  <li>• Documentation</li>
                  <li>• Other</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">This type field helps you organize and filter compliance items by the nature of the obligation.</p>
            </div>
          )
        },
        {
          question: "How do I link a compliance item to a contract?",
          answer: (
            <div className="space-y-3">
              <p>Linking compliance items to contracts helps track contractual obligations and provides better visibility:</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>When creating/editing a compliance item, select an <strong>Organization</strong> first</li>
                <li>The <strong>Contract</strong> dropdown will automatically show contracts for that organization</li>
                <li>Select the relevant contract (optional)</li>
                <li>The link is maintained even if you change the organization</li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md mt-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm"><strong>Smart Filtering:</strong> The contract dropdown intelligently filters based on your selected organization while preserving any already-linked contract.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I customize table columns?",
          answer: (
            <div className="space-y-3">
              <p>You can show or hide columns in the compliance table to customize your view:</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click the <strong>"Columns"</strong> button (top right of table)</li>
                <li>Toggle columns on/off:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Due Date (always visible)</li>
                    <li>Commitment (always visible)</li>
                    <li>Type</li>
                    <li>Category</li>
                    <li>Organization</li>
                    <li>Contract</li>
                    <li>Responsible</li>
                    <li>Status</li>
                  </ul>
                </li>
                <li>Your preferences are saved automatically</li>
              </ol>
              
              <p className="text-sm text-muted-foreground">The Due Date and Commitment columns are always visible as they're required fields.</p>
            </div>
          )
        }
      ]
    },
    {
      id: "billable",
      title: "Billable Events",
      icon: DollarSign,
      description: "Track revenue and billing",
      content: [
        {
          question: "How do I create a billable event?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Billable Events"</strong> in the sidebar</li>
                <li>Click <strong>"Add Event"</strong> button</li>
                <li>Select organization and optionally link to contract/compliance item</li>
                <li>Enter description, rate, and units</li>
                <li>Total amount auto-calculates (Rate × Units)</li>
                <li>Set billing date and invoice number</li>
                <li>Click <strong>"Create"</strong></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Example:</p>
                <div className="text-sm space-y-1">
                  <div>Description: <span className="font-mono">Consulting - October 2025</span></div>
                  <div>Rate: <span className="font-mono">$150.00 per hour</span></div>
                  <div>Units: <span className="font-mono">40 hours</span></div>
                  <div>Total: <span className="font-mono text-green-600">$6,000.00</span> (auto)</div>
                </div>
              </div>
            </div>
          )
        },
        {
          question: "How do I track payments?",
          answer: (
            <div className="space-y-2">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Find the billable event</li>
                <li>Click <strong>"Mark as Paid"</strong> button</li>
                <li>Payment date auto-populates</li>
                <li>Status updates to "Paid"</li>
              </ol>
            </div>
          )
        }
      ]
    },
    {
      id: "evidence",
      title: "Evidence Locker",
      icon: Shield,
      description: "Store audit documentation",
      content: [
        {
          question: "How do I upload evidence?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to a compliance item or billable event</li>
                <li>Click <strong>"Add Evidence"</strong> button</li>
                <li>Enter title and description</li>
                <li>Select evidence type (Document/Email/Screenshot/Report/Other)</li>
                <li>Upload the file (10MB max)</li>
                <li>Click <strong>"Upload Evidence"</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Supported File Types:</p>
                  <p>PDF, DOCX, XLSX, TXT, PNG, JPG, JPEG, ZIP, CSV, JSON</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "export-import",
      title: "Data Export & Import",
      icon: Download,
      description: "Backup and restore data",
      content: [
        {
          question: "How do I export all data (Unified ZIP Export)?",
          answer: (
            <div className="space-y-3">
              <p><strong>Recommended Method - Unified ZIP Export:</strong></p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to <strong>Export/Import</strong> page</li>
                <li>Click <strong>"Export Complete Backup (ZIP)"</strong></li>
                <li>A ZIP file downloads containing BOTH database data AND evidence files</li>
                <li>Store this file securely as your complete backup</li>
              </ol>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Complete Backup Solution:</p>
                  <p>The ZIP export packages database data AND evidence files together, ensuring evidence files remain properly linked after restoration. This solves the orphaned records issue from separate exports.</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">The export includes: organizations, contracts, compliance items, billable events, evidence files and metadata, audit logs, OKR data, and system settings.</p>
              
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="text-sm font-semibold mb-1">Legacy JSON Export:</p>
                <p className="text-sm">Database-only JSON export is still available but not recommended for complete system backups.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I restore from a backup?",
          answer: (
            <div className="space-y-3">
              <p><strong>Restoring from Unified ZIP Backup:</strong></p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to <strong>Export/Import</strong> page</li>
                <li>Click <strong>"Import Complete Backup (ZIP)"</strong></li>
                <li>Select your backup ZIP file</li>
                <li>Review the import summary showing what will be restored</li>
                <li>Click <strong>"Confirm Import"</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Smart Duplicate Detection:</p>
                  <p>The restore process includes duplicate detection to prevent re-importing evidence that already exists in the database.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md mt-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Import merges data - existing records are skipped, only new records are added. Evidence files with the same hash are not re-uploaded.</p>
              </div>
            </div>
          )
        },
        {
          question: "What about Cascade Delete Protection?",
          answer: (
            <div className="space-y-3">
              <p>The system includes automatic cascade delete protection to prevent orphaned evidence records:</p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li>Evidence items are automatically deleted when their parent <strong>compliance items</strong> are deleted</li>
                <li>Evidence items are automatically deleted when their parent <strong>contracts</strong> are deleted</li>
                <li>Evidence items are automatically deleted when their parent <strong>billable events</strong> are deleted</li>
              </ul>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md mt-2">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">This ensures your database stays clean without orphaned evidence records.</p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "admin",
      title: "Admin Functions",
      icon: Settings,
      description: "User management and system settings",
      content: [
        {
          question: "How do I create a new user?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Panel</strong> → <strong>Users</strong></li>
                <li>Click <strong>"Create User"</strong></li>
                <li>Fill in username, password, full name, and email</li>
                <li>Select role: <Badge className="mx-1">Admin</Badge> or <Badge variant="secondary" className="mx-1">User</Badge></li>
                <li>Click <strong>"Create User"</strong></li>
              </ol>
            </div>
          )
        },
        {
          question: "What does Database Reset do?",
          answer: (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-2">DANGER ZONE - This deletes all business data!</p>
                  <p className="mb-2"><strong>What it deletes:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All organizations/customers</li>
                    <li>All contracts</li>
                    <li>All compliance items</li>
                    <li>All billable events</li>
                    <li>All evidence files</li>
                    <li>All audit logs</li>
                  </ul>
                  <p className="mt-2"><strong>What it keeps:</strong> User accounts and passwords</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: "quickbooks",
      title: "QuickBooks Integration",
      icon: LinkIcon,
      description: "Connect and sync with QuickBooks Online",
      content: [
        {
          question: "How do I get QuickBooks OAuth credentials?",
          answer: (
            <div className="space-y-3">
              <p>Before using the QuickBooks integration, you need to create OAuth credentials in the QuickBooks Developer Portal.</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.intuit.com</a></li>
                <li>Sign in with your Intuit account (or create one)</li>
                <li>Click <strong>"Create an app"</strong></li>
                <li>Select <strong>"QuickBooks Online"</strong> as the platform</li>
                <li>Choose your scopes (accounting scope required for invoices)</li>
                <li>Set your Redirect URI:
                  <div className="bg-muted p-2 rounded-md font-mono text-xs mt-1">
                    http://localhost:5000/api/quickbooks/callback
                  </div>
                </li>
                <li>Save and copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Sandbox vs Production:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Sandbox</strong>: For testing with fake data (free)</li>
                    <li><strong>Production</strong>: For real QuickBooks companies (requires approval)</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          question: "How do I configure QuickBooks OAuth credentials?",
          answer: (
            <div className="space-y-3">
              <p>Administrators can configure QuickBooks integration credentials in the Admin Panel. This is especially useful for Docker deployments.</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Admin Panel</strong> → <strong>QuickBooks Online Settings</strong></li>
                <li>Enter your QuickBooks application credentials:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Client ID</strong>: Your QuickBooks OAuth Client ID</li>
                    <li><strong>Client Secret</strong>: Your QuickBooks OAuth Client Secret</li>
                    <li><strong>Redirect URI</strong>: OAuth callback URL (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:5000/api/quickbooks/callback</code>)</li>
                    <li><strong>Environment</strong>: Select "Sandbox (Development)" or "Production"</li>
                  </ul>
                </li>
                <li>Click <strong>"Save QuickBooks Settings"</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Security Features:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Client Secret is masked and never exposed in API responses</li>
                    <li>Leave secret field empty to keep existing value unchanged</li>
                    <li>All inputs are validated before saving</li>
                    <li>All changes are logged in the audit trail</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Rotating Credentials:</p>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Create new OAuth credentials in QuickBooks Developer Portal</li>
                  <li>Update settings in Admin Panel with new Client ID and Secret</li>
                  <li>Reconnect all organizations to QuickBooks</li>
                  <li>Revoke old credentials in QuickBooks Developer Portal</li>
                </ol>
              </div>
            </div>
          )
        },
        {
          question: "How do I connect QuickBooks to an organization?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>"Organizations"</strong> page</li>
                <li>Find the organization you want to connect</li>
                <li>Click the <strong>"Connect"</strong> button in the QuickBooks column</li>
                <li>A popup window will open - sign in to QuickBooks</li>
                <li>Authorize BizGov to access your QuickBooks data</li>
                <li>The connection status will update to "Connected"</li>
              </ol>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">You need QuickBooks Online credentials and appropriate permissions to connect.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I map a QuickBooks customer to an organization?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>After connecting QuickBooks, click <strong>"Manage"</strong> on the organization</li>
                <li>Click <strong>"Map Customer"</strong> button</li>
                <li>Use the search box to find your QuickBooks customer</li>
                <li>Click on the customer to select and map them</li>
                <li>The mapped customer will now appear in the management dialog</li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="font-semibold">Why map customers?</p>
                <p className="text-sm">Mapping links your BizGov organization to a specific QuickBooks customer, allowing invoice sync and revenue tracking.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I sync QuickBooks invoices?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Make sure you've connected QuickBooks and mapped a customer</li>
                <li>Open the QuickBooks management dialog for the organization</li>
                <li>Click <strong>"Sync Invoices"</strong> button</li>
                <li>Invoices will be pulled from QuickBooks and stored locally</li>
                <li>A success message will show the number of synced invoices</li>
              </ol>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Invoices sync automatically updates existing invoices and adds new ones from QuickBooks.</p>
              </div>
            </div>
          )
        },
        {
          question: "What if my QuickBooks connection expires?",
          answer: (
            <div className="space-y-3">
              <p>QuickBooks access tokens expire after 1 hour and refresh tokens after 100 days.</p>
              
              <div className="space-y-2">
                <p className="font-semibold">If connection status shows "expired":</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Click <strong>"Disconnect"</strong> in the management dialog</li>
                  <li>Click <strong>"Connect"</strong> again to reauthorize</li>
                  <li>Sign in to QuickBooks and authorize again</li>
                  <li>Your customer mapping will be preserved</li>
                </ol>
              </div>
              
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">The system automatically refreshes access tokens when possible, but refresh tokens expire after 100 days of inactivity.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I disconnect QuickBooks?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Manage"</strong> on the organization</li>
                <li>Scroll down and click <strong>"Disconnect QuickBooks"</strong></li>
                <li>The connection will be removed and tokens revoked</li>
                <li>Synced invoices will remain in the database</li>
              </ol>
              
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="text-sm"><strong>Note:</strong> Disconnecting removes the live connection but keeps historical invoice data.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I check QuickBooks system health?",
          answer: (
            <div className="space-y-3">
              <p>The Admin Panel includes a System Health card that monitors the QuickBooks integration status.</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to <strong>Admin Panel</strong></li>
                <li>Locate the <strong>"System Health"</strong> card</li>
                <li>Review the health indicators:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Status</strong>: Green (Healthy), Yellow (Not Configured), or Red (Error)</li>
                    <li><strong>Client ID</strong>: Masked for security</li>
                    <li><strong>Environment</strong>: Sandbox or Production</li>
                    <li><strong>Active Connections</strong>: Total QB connections</li>
                    <li><strong>Valid Connections</strong>: Non-expired connections</li>
                    <li><strong>Expired Connections</strong>: Need reconnection</li>
                    <li><strong>Last Check</strong>: Timestamp of last health check</li>
                  </ul>
                </li>
                <li>Click <strong>"Refresh"</strong> to manually update health status</li>
              </ol>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-300">Healthy</p>
                    <p className="text-green-600 dark:text-green-400">Credentials configured</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">Not Configured</p>
                    <p className="text-amber-600 dark:text-amber-400">No credentials set</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-700 dark:text-red-300">Error</p>
                    <p className="text-red-600 dark:text-red-400">Health check failed</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">The health check auto-refreshes every 60 seconds. Use the Refresh button for immediate updates.</p>
              </div>
            </div>
          )
        },
        {
          question: "How do I test the QuickBooks integration?",
          answer: (
            <div className="space-y-3">
              <p>Follow this end-to-end test to verify your QuickBooks integration is working correctly.</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Step 1: Verify Credentials</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Go to Admin Panel → QuickBooks Online Settings</li>
                    <li>Verify Client ID and Environment are set</li>
                    <li>Check System Health shows "Healthy" (green status)</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Step 2: Connect Test Organization</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Create a test organization (e.g., "Test Company")</li>
                    <li>Click "Connect" in the QuickBooks column</li>
                    <li>Sign in to your QuickBooks sandbox/company</li>
                    <li>Authorize the connection</li>
                    <li>Verify status changes to "Connected"</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Step 3: Map Customer</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Click "Manage" on the test organization</li>
                    <li>Click "Map Customer"</li>
                    <li>Search for a QuickBooks customer</li>
                    <li>Select a customer to map</li>
                    <li>Verify customer name appears in dialog</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Step 4: Sync Invoices</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Click "Sync Invoices" in the management dialog</li>
                    <li>Wait for sync to complete</li>
                    <li>Verify success message shows invoice count</li>
                    <li>Check that invoices appear in the list</li>
                  </ol>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Step 5: Verify Health Status</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    <li>Return to Admin Panel</li>
                    <li>Check System Health shows 1 Active Connection</li>
                    <li>Verify Valid Connections count is 1</li>
                    <li>Confirm Expired Connections is 0</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">If all steps complete successfully, your QuickBooks integration is working correctly!</p>
              </div>
            </div>
          )
        },
        {
          question: "Troubleshooting QuickBooks issues",
          answer: (
            <div className="space-y-3">
              <p>Common issues and solutions:</p>
              
              <div className="space-y-3">
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="font-semibold mb-2">❌ Connection button doesn't open popup</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Check that QuickBooks credentials are configured in Admin Panel</li>
                    <li>Verify System Health shows "Healthy" status</li>
                    <li>Check browser console for errors</li>
                    <li>Disable popup blockers for this site</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="font-semibold mb-2">❌ OAuth callback fails with "invalid_client"</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Verify Client ID and Secret are correct</li>
                    <li>Check Redirect URI matches exactly (including http/https)</li>
                    <li>Ensure environment (sandbox/production) matches your QB app</li>
                    <li>Verify credentials haven't expired or been revoked</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="font-semibold mb-2">❌ Connection shows "expired"</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Disconnect and reconnect the organization</li>
                    <li>QuickBooks refresh tokens expire after 100 days of inactivity</li>
                    <li>Customer mapping is preserved during reconnection</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="font-semibold mb-2">❌ Invoice sync returns 0 invoices</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Verify customer mapping is correct</li>
                    <li>Check that the mapped customer has invoices in QuickBooks</li>
                    <li>Ensure your QB app has "Accounting" scope enabled</li>
                    <li>Check that connection hasn't expired</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3 bg-muted/50">
                  <p className="font-semibold mb-2">❌ System Health shows "Not Configured"</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Go to Admin Panel → QuickBooks Online Settings</li>
                    <li>Enter Client ID, Client Secret, and Redirect URI</li>
                    <li>Select correct environment (sandbox/production)</li>
                    <li>Save settings and refresh health check</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Still having issues? Check the audit log in the Admin Panel for detailed error messages and timestamps.</p>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const filteredSections = searchQuery
    ? helpSections.map(section => ({
        ...section,
        content: section.content.filter(item => 
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.content.length > 0)
    : helpSections;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 overflow-auto min-h-screen">
          <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-help-title">
                Help Center
              </h1>
              <p className="text-muted-foreground">
                Complete end-to-end instructions and examples for using BizGov
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search help articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-help-search"
              />
            </div>

            {/* Quick Start Guide */}
            {!searchQuery && (
              <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to get started with BizGov
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { num: 1, title: "Add Organizations", desc: "Create your customer records" },
                      { num: 2, title: "Create Contracts", desc: "Set up agreements and terms" },
                      { num: 3, title: "Track Compliance", desc: "Add obligations and deadlines" },
                      { num: 4, title: "Upload Evidence", desc: "Build your audit trail" }
                    ].map(step => (
                      <div key={step.num} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {step.num}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredSections.map(section => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="col-span-1 lg:col-span-3" data-testid={`card-help-${section.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {section.content.map((item, idx) => (
                          <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                            <AccordionTrigger className="text-left">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2">
                                {item.answer}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {searchQuery && filteredSections.length === 0 && (
              <Card className="text-center p-12">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No results found</p>
                  <p className="text-sm">Try different keywords or browse all topics above</p>
                </div>
              </Card>
            )}

            <Separator className="my-8" />

            {/* Additional Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Docker Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn how to deploy BizGov with Docker
                  </p>
                  <p className="text-xs text-muted-foreground">
                    See: <code className="bg-muted px-1 py-0.5 rounded">DOCKER_SETUP.md</code>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Database Connection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect DBeaver or other tools
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Host: <code className="bg-muted px-1 py-0.5 rounded">localhost:5432</code></div>
                    <div>Database: <code className="bg-muted px-1 py-0.5 rounded">bizgov</code></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Getting Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Need additional help?
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Check Docker logs: <code className="bg-muted px-1 py-0.5 rounded">docker-logs-verbose.bat</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
    </div>
  );
}
