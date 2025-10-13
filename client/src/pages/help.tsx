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
  Link as LinkIcon
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
            <div className="space-y-2">
              <p>The dashboard displays key compliance metrics:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Total Items</strong> - All compliance obligations tracked</li>
                <li><strong>Completed</strong> - Items marked as complete</li>
                <li><strong>Pending</strong> - Items awaiting action</li>
                <li><strong>Overdue</strong> - Items past their due date</li>
              </ul>
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
                <li>Click <strong>"Compliance"</strong> → <strong>"Import CSV"</strong> button</li>
                <li>Download the sample CSV template</li>
                <li>Fill in your data following the format</li>
                <li>Upload your completed CSV</li>
                <li>Review validation results</li>
                <li>Items are automatically created</li>
              </ol>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-mono overflow-x-auto">
                  Customer Code,Category,Type,Commitment,Description,Responsible Party,Due Date,Status
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
          question: "How do I export all data?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Settings"</strong> → <strong>"Export Database"</strong></li>
                <li>A JSON file downloads with all your data</li>
                <li>Store this file securely as a backup</li>
              </ol>
              
              <p className="text-sm text-muted-foreground">The export includes: organizations, contracts, compliance items, billable events, evidence metadata, audit logs, and email alert history.</p>
            </div>
          )
        },
        {
          question: "How do I import data?",
          answer: (
            <div className="space-y-3">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>"Settings"</strong> → <strong>"Import Database"</strong></li>
                <li>Select your exported JSON file</li>
                <li>Review the import summary</li>
                <li>Click <strong>"Confirm Import"</strong></li>
              </ol>
              
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Import merges data - existing records are skipped, only new records are added.</p>
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
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
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
    </div>
  );
}
